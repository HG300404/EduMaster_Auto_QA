import os
import re
import base64
import shutil
import subprocess
import logging
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.core_models import TestRun, TestRunStatus, TestResult, TestCase
from app.utils.report_parser import parse_pytest_json

logger = logging.getLogger(__name__)

SYNC_DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg", "postgresql")
engine = create_engine(SYNC_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BASE_TEST_DIR = os.getenv("BASE_TEST_DIR", "/app/qa_core/tests")
REPORT_DIR = os.getenv("REPORT_DIR", "/app/qa_core/reports")
LOG_DIR = os.getenv("LOG_DIR", "/app/qa_core/tests/logs")


def _save_playwright_screenshot_attachment(attachment: dict, dest: str) -> bool:
    """Persist a Playwright screenshot attachment (file path or embedded base64 body)."""
    src = attachment.get("path", "")
    if src and os.path.exists(src):
        shutil.copy(src, dest)
        return True

    body = attachment.get("body")
    if body:
        with open(dest, "wb") as out:
            out.write(base64.b64decode(body))
        return True

    return False


def _collect_direct_step_screenshots(test_run_id: int) -> tuple[list, str | None]:
    """Fallback: PNGs written by tests/ui/helpers/screenshot.ts as run_{id}_{step}.png."""
    prefix = f"run_{test_run_id}_"
    indexed_re = re.compile(rf"^run_{test_run_id}_\d+_")
    step_screenshots = []
    saved_screenshot_path = None

    if not os.path.isdir(REPORT_DIR):
        return step_screenshots, saved_screenshot_path

    candidates = []
    for name in os.listdir(REPORT_DIR):
        if not name.startswith(prefix) or not name.endswith(".png"):
            continue
        if indexed_re.match(name):
            continue
        label = name[len(prefix):-4].replace("_", " ")
        candidates.append((name, label))

    candidates.sort(key=lambda item: os.path.getmtime(os.path.join(REPORT_DIR, item[0])))

    for name, label in candidates:
        path = f"/reports/{name}"
        step_screenshots.append({"description": label, "screenshot_path": path})
        saved_screenshot_path = path

    return step_screenshots, saved_screenshot_path


def _build_ui_step_logs(step_screenshots: list, status: str, error: str | None) -> list:
    extracted_steps = []
    for step_shot in step_screenshots:
        extracted_steps.append({
            "method": "UI_STEP",
            "url": step_shot["description"],
            "screenshot_path": step_shot["screenshot_path"],
            "status_code": 200 if status == "passed" else 500,
            "request_body": "",
            "response_body": "Success" if status == "passed" else (error or "Failed"),
        })
    return extracted_steps


def _extract_playwright_results(playwright_data: dict, test_run_id: int) -> list:
    """Parse Playwright JSON report and return list of result dicts.
    Structure: suite.suites[].specs[].tests[].results[]
    """
    results = []
    screenshot_index = 0

    def process_suite(suite: dict):
        nonlocal screenshot_index
        # Process specs at this level
        for spec in suite.get("specs", []):
            test_name = spec.get("title", "unknown")
            for test in spec.get("tests", []):
                for result in test.get("results", []):
                    status = result.get("status", "unknown")
                    # Normalize Playwright statuses → passed / failed
                    if status == "timedOut":
                        status = "failed"

                    duration = result.get("duration", 0) / 1000.0

                    error = None
                    err_obj = result.get("error")
                    if err_obj and isinstance(err_obj, dict):
                        error = err_obj.get("message")

                    # Collect labelled step screenshots (step:<description>) and legacy "screenshot"
                    saved_screenshot_path = None
                    step_screenshots = []
                    safe_name = re.sub(r"[^a-zA-Z0-9]", "_", test_name)[:80]
                    direct_name = f"run_{test_run_id}_{safe_name}.png"
                    direct_dest = os.path.join(REPORT_DIR, direct_name)

                    for attachment in result.get("attachments", []):
                        name = attachment.get("name", "")
                        if name != "screenshot" and not name.startswith("step:"):
                            continue
                        label = name[5:] if name.startswith("step:") else "Screenshot"
                        filename = f"run_{test_run_id}_{screenshot_index}_{safe_name}.png"
                        dest = os.path.join(REPORT_DIR, filename)
                        try:
                            if _save_playwright_screenshot_attachment(attachment, dest):
                                path = f"/reports/{filename}"
                                step_screenshots.append({
                                    "description": label,
                                    "screenshot_path": path,
                                })
                                saved_screenshot_path = path
                                screenshot_index += 1
                        except Exception as copy_err:
                            logger.error(f"Failed to save screenshot: {copy_err}")

                    if not saved_screenshot_path and os.path.exists(direct_dest):
                        try:
                            filename = f"run_{test_run_id}_{screenshot_index}_{safe_name}.png"
                            dest = os.path.join(REPORT_DIR, filename)
                            shutil.copy(direct_dest, dest)
                            saved_screenshot_path = f"/reports/{filename}"
                            step_screenshots.append({
                                "description": "Screenshot",
                                "screenshot_path": saved_screenshot_path,
                            })
                            screenshot_index += 1
                        except Exception as copy_err:
                            logger.error(f"Failed to copy direct screenshot: {copy_err}")

                    if not step_screenshots:
                        direct_steps, direct_last = _collect_direct_step_screenshots(test_run_id)
                        if direct_steps:
                            step_screenshots = direct_steps
                            saved_screenshot_path = direct_last

                    extracted_steps = []
                    if step_screenshots:
                        extracted_steps = _build_ui_step_logs(step_screenshots, status, error)
                    else:
                        def flatten_steps(steps_list):
                            for step in steps_list:
                                title = step.get("title", "")
                                duration_ms = step.get("duration", 0)
                                extracted_steps.append({
                                    "method": "UI_ACTION",
                                    "url": title,
                                    "status_code": 200 if not step.get("error") else 500,
                                    "request_body": f"Duration: {duration_ms}ms",
                                    "response_body": step.get("error", {}).get("message", "Success") if step.get("error") else "Success"
                                })
                                if "steps" in step:
                                    flatten_steps(step["steps"])

                        flatten_steps(result.get("steps", []))

                    results.append({
                        "test_name": test_name,
                        "status": status,
                        "duration": duration,
                        "error": error,
                        "api_logs": extracted_steps,
                        "screenshot_path": saved_screenshot_path,
                    })

        # Recurse into nested suites
        for sub_suite in suite.get("suites", []):
            process_suite(sub_suite)

    for suite in playwright_data.get("suites", []):
        process_suite(suite)

    return results

def execute_test_case(test_run_id: int, file_path: str, function_name: str = None):
    db = SessionLocal()
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    
    log_file_path = f"{LOG_DIR}/run_{test_run_id}.log"
    report_file_path = f"{REPORT_DIR}/{test_run_id}.json"
    process = None
    
    try:
        # Update status to running
        test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
        if not test_run:
            logger.error(f"TestRun {test_run_id} not found.")
            return
            
        test_run.status = TestRunStatus.running
        db.commit()
        
        # Check if it is a UI test
        is_ui_test = "ui" in file_path.lower() or "spec.ts" in file_path.lower()
        
        results = []
        
        if is_ui_test:
            # === EXECUTE REAL PLAYWRIGHT TEST ===
            logger.info(f"Executing real UI Playwright test for {file_path}")
            
            # Ensure node_modules are installed
            if not os.path.exists("/app/qa_core/node_modules"):
                logger.info("Installing Node.js dependencies in qa_core...")
                subprocess.run(["npm", "install"], cwd="/app/qa_core")
            
            # Run Playwright with --reporter=list,json to separate clean list stdout from JSON file output
            cmd = ["npx", "playwright", "test", f"tests/{file_path}", "--reporter=list,json"]
            # function_name IS the Playwright test title → dùng trực tiếp với -g
            # Nếu None (ví dụ class serial suite) → chạy cả spec file
            if function_name:
                cmd.extend(["-g", function_name])
            
            logger.info(f"Executing: {' '.join(cmd)}")
            
            # Each run gets its own JSON report file — no overwrite between runs
            env = {
                **os.environ,
                "PLAYWRIGHT_JSON_OUTPUT_NAME": report_file_path,
                "QA_TEST_RUN_ID": str(test_run_id),
                "QA_REPORT_DIR": REPORT_DIR,
            }
            
            with open(log_file_path, "w", encoding="utf-8") as log_file:
                log_file.write("============================= test session starts ==============================\n")
                log_file.write("platform linux -- Playwright UI Automation Framework -- /usr/bin/node\n")
                log_file.write("configfile: /app/qa_core/playwright.config.ts\n")
                log_file.write(f"running spec: qa_core/tests/{file_path}\n")
                if function_name:
                    log_file.write(f"filter pattern: -g '{function_name}'\n")
                log_file.write("--------------------------------------------------------------------------------\n")
                log_file.flush()
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    cwd="/app/qa_core",
                    env=env
                )
                for line in process.stdout:
                    stripped_line = line.strip()
                    # Filter out any raw JSON report lines or config fields to prevent stdout leakage
                    if (stripped_line.startswith("{") or 
                        stripped_line.startswith("}") or 
                        stripped_line.startswith('"') or 
                        stripped_line.startswith("configFile") or
                        stripped_line.startswith("rootDir") or
                        "\"config\":" in stripped_line or 
                        "\"suites\":" in stripped_line or
                        "\"errors\":" in stripped_line or
                        "\"stats\":" in stripped_line):
                        continue
                    
                    log_file.write(line)
                    log_file.flush()
                process.wait()
            
            # Read the per-run JSON report file written by Playwright
            results = []
            if os.path.exists(report_file_path):
                try:
                    with open(report_file_path, "r", encoding="utf-8") as f:
                        playwright_data = json.load(f)
                    results = _extract_playwright_results(playwright_data, test_run_id)
                except Exception as e:
                    logger.error(f"Failed to parse Playwright report at {report_file_path}: {e}")
            else:
                logger.error(f"Playwright JSON report not found: {report_file_path}")

            # Append professional status summary and report saved path to log file
            try:
                total_duration = 0.0
                passed_count = 0
                failed_count = 0
                for res in results:
                    total_duration += res.get("duration", 0.0)
                    if res.get("status") == "passed":
                        passed_count += 1
                    else:
                        failed_count += 1
                
                status_parts = []
                if passed_count > 0:
                    status_parts.append(f"{passed_count} passed")
                if failed_count > 0:
                    status_parts.append(f"{failed_count} failed")
                if not status_parts:
                    status_parts.append("0 run")
                    
                status_summary = ", ".join(status_parts)
                
                with open(log_file_path, "a", encoding="utf-8") as log_file:
                    log_file.write("\n--------------------------------- JSON report ----------------------------------\n")
                    log_file.write(f"report saved to: {report_file_path}\n")
                    log_file.write(f"=========================== {status_summary} in {total_duration:.2f}s ===========================\n")
            except Exception as e:
                logger.error(f"Failed to write summary to log file: {e}")
                
        else:
            # === EXECUTE REAL API PYTEST ===
            # Execute test (run a single function if provided, otherwise the whole file)
            test_target = f"{BASE_TEST_DIR}/{file_path}"
            if function_name:
                test_target += f"::{function_name}"
                
            cmd = [
                "pytest",
                test_target,
                "--json-report",
                f"--json-report-file={report_file_path}"
            ]
            
            logger.info(f"Executing: {' '.join(cmd)}")
            
            with open(log_file_path, "w", encoding="utf-8") as log_file:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )
                
                for line in iter(process.stdout.readline, ''):
                    log_file.write(line)
                    log_file.flush()
                
                # Wait for process to fully terminate
                process.stdout.close()
                process.wait(timeout=1800)
            
            # Parse report JSON
            results = parse_pytest_json(report_file_path)
        
        # === ROBUST FALLBACK FOR EMPTY / FAILED RUN DISCOVERY ===
        if not results:
            log_content = ""
            if os.path.exists(log_file_path):
                try:
                    with open(log_file_path, "r", encoding="utf-8") as f:
                        log_content = f.read()
                except Exception:
                    pass
            
            # Default failure messages
            if is_ui_test:
                error_reason = (
                    f"Playwright found 0 tests for '{file_path}'"
                    + (f" with filter -g '{function_name}'." if function_name else ".")
                    + " Ensure TestCase.function_name matches the Playwright test title exactly."
                )
            else:
                error_reason = "Test suite execution failed or pytest was unable to find/execute target tests."
            if "ConnectionError" in log_content or "NameResolutionError" in log_content or "Max retries exceeded" in log_content:
                error_reason = "SUT Connection Error: Failed to resolve or communicate with SUT 'backend:8000'. Please make sure backend container is online."
            elif not is_ui_test and "no tests ran" in log_content:
                error_reason = f"Test discovery mismatch: Filepath '{file_path}' or testcase '{function_name}' was not discovered by pytest scanner."
            elif is_ui_test and ("0 passed" in log_content or "0 run" in log_content or process.returncode != 0):
                if function_name and function_name not in log_content:
                    error_reason = (
                        f"Playwright filter -g '{function_name}' matched no tests in '{file_path}'. "
                        "Update function_name in DB (re-run seed.py) to match the test title in the .spec.ts file."
                    )
            
            # Append warning directly to terminal logs
            try:
                with open(log_file_path, "a", encoding="utf-8") as log_file:
                    log_file.write(f"\n[CRITICAL RUNTIME ERROR] {error_reason}\n")
                    log_file.write("A mock failed result has been generated in database to prevent trace loss.\n")
            except Exception:
                pass
                
            # Create a mock failed result so the UI has trace records in Postgres
            results = [{
                "test_name": f"tests/{file_path}::{function_name or 'test_execution_safety'}",
                "status": "failed",
                "duration": 1.5,
                "error": error_reason,
                "api_logs": []
            }]
            
        # Get all test cases for this file path to map test_case_id
        test_cases_db = db.query(TestCase).filter(TestCase.file_path == file_path).all()
        func_to_id_map = {}
        for tc in test_cases_db:
            if tc.function_name:
                func_to_id_map[tc.function_name] = tc.id
        
        # Save results
        has_failure = False
        for res in results:
            if res["status"] == "failed":
                has_failure = True
                
            # Extract clean function name from pytest nodeid
            node_parts = res["test_name"].split("::")
            actual_func_name = node_parts[-1].split("[")[0] if node_parts else res["test_name"]
            
            test_case_id = func_to_id_map.get(actual_func_name)
            
            test_result = TestResult(
                test_run_id=test_run_id,
                test_case_id=test_case_id,
                test_name=res["test_name"],
                status=res["status"],
                duration=res["duration"],
                error_message=res["error"],
                execution_data=json.dumps({
                    "parameters": res.get("parameters", {
                        "environment": "Production" if not is_ui_test else "Staging",
                        "framework": "pytest" if not is_ui_test else "playwright"
                    })
                }),
                steps_data=json.dumps(res.get("api_logs", [])),
                screenshot_path=res.get("screenshot_path"),
                log_file_path=log_file_path
            )
            db.add(test_result)
            
        test_run.status = TestRunStatus.failed if has_failure else TestRunStatus.completed
        test_run.finished_at = datetime.now(timezone.utc)
        db.commit()
        
    except subprocess.TimeoutExpired:
        logger.error(f"TestRun {test_run_id} timed out.")
        if process:
            process.kill()
        test_run.status = TestRunStatus.failed
        test_run.finished_at = datetime.now(timezone.utc)
        db.commit()
        
    except Exception as e:
        logger.error(f"TestRun {test_run_id} failed with error: {e}")
        # Write traceback error message to the log file so the user can easily debug on the frontend terminal UI!
        try:
            import traceback
            with open(log_file_path, "a", encoding="utf-8") as log_file:
                log_file.write(f"\n[SYSTEM ERROR] Test run execution failed: {str(e)}\n")
                log_file.write(traceback.format_exc())
        except Exception as log_err:
            logger.error(f"Failed to write error to log file: {log_err}")
            
        db.rollback()
        test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
        if test_run:
            test_run.status = TestRunStatus.failed
            test_run.finished_at = datetime.now(timezone.utc)
            db.commit()
            
    finally:
        db.close()


def reparse_playwright_test_run(test_run_id: int) -> bool:
    """Re-read Playwright JSON report and refresh screenshot/step metadata for an existing run."""
    report_file_path = os.path.join(REPORT_DIR, f"{test_run_id}.json")
    if not os.path.exists(report_file_path):
        logger.error(f"Cannot reparse: report not found at {report_file_path}")
        return False

    db = SessionLocal()
    try:
        with open(report_file_path, "r", encoding="utf-8") as f:
            playwright_data = json.load(f)
        parsed = _extract_playwright_results(playwright_data, test_run_id)
        if not parsed:
            logger.error(f"Reparse produced no results for test run {test_run_id}")
            return False

        test_results = (
            db.query(TestResult)
            .filter(TestResult.test_run_id == test_run_id)
            .order_by(TestResult.id)
            .all()
        )
        for test_result, res in zip(test_results, parsed):
            test_result.steps_data = json.dumps(res.get("api_logs", []))
            test_result.screenshot_path = res.get("screenshot_path")

        db.commit()
        logger.info(f"Reparsed Playwright metadata for test run {test_run_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to reparse test run {test_run_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()
