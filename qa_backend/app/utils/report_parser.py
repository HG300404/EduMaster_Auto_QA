import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

def parse_pytest_json(file_path: str) -> List[dict]:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        results = []
        tests = data.get("tests", [])
        for test in tests:
            test_name = test.get("nodeid", "Unknown")
            status = test.get("outcome", "unknown")
            
            # Duration calculation: sum of setup, call, teardown
            duration = 0.0
            error_message = None
            
            call_info = test.get("call", {})
            setup_info = test.get("setup", {})
            teardown_info = test.get("teardown", {})
            
            duration += setup_info.get("duration", 0.0)
            duration += call_info.get("duration", 0.0)
            duration += teardown_info.get("duration", 0.0)
            
            if status in ["failed", "error", "xfailed"]:
                if "crash" in call_info:
                    error_message = call_info["crash"].get("message")
                elif "longrepr" in call_info:
                    error_message = call_info["longrepr"]
                elif "longrepr" in setup_info:
                    error_message = setup_info["longrepr"]
                
                # Normalize 'error' and 'xfailed' to 'failed' for the UI and DB
                status = "failed"
                    
                if isinstance(error_message, dict):
                    if "reprcrash" in error_message:
                        error_message = error_message["reprcrash"].get("message", str(error_message))
                    else:
                        error_message = str(error_message)
                elif error_message is not None:
                    error_message = str(error_message)
            
            # Extract custom user properties (like api_interaction_logs)
            user_props = test.get("metadata", {}) or test.get("user_properties", {})
            api_logs = []
            if isinstance(user_props, dict):
                api_logs = user_props.get("api_interaction_logs", [])
            elif isinstance(user_props, list):
                for prop in user_props:
                    if isinstance(prop, dict) and "api_interaction_logs" in prop:
                        api_logs = prop["api_interaction_logs"]
                        break
                    elif isinstance(prop, (list, tuple)) and len(prop) >= 2 and prop[0] == "api_interaction_logs":
                        api_logs = prop[1]
                        break
            
            # Extract parameters from nodeid (e.g. test_login[admin-123])
            parameters = {}
            if "[" in test_name and test_name.endswith("]"):
                params_str = test_name.split("[")[-1][:-1]
                parameters["test_data"] = params_str
            
            results.append({
                "test_name": test_name,
                "status": status,
                "duration": duration,
                "error": error_message,
                "api_logs": api_logs,
                "parameters": parameters
            })
            
        return results
    except Exception as e:
        logger.error(f"Error parsing pytest JSON report at {file_path}: {e}")
        return []
