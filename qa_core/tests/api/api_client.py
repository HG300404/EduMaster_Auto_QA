import requests
import os

class APIClient:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv('API_URL', 'http://backend:8000')
        self.session = requests.Session()
        self.token = None
        self.logs = []

    def _log_request(self, response):
        """Helper to record request and response details."""
        try:
            req_body = response.request.body.decode('utf-8') if response.request.body else None
        except Exception:
            req_body = str(response.request.body)

        log_entry = {
            "method": response.request.method,
            "url": response.request.url,
            "request_body": req_body,
            "status_code": response.status_code,
            "response_body": response.text
        }
        self.logs.append(log_entry)
        return response

    def _execute_request(self, method, url, **kwargs):
        try:
            response = self.session.request(method, url, **kwargs)
            return self._log_request(response)
        except Exception as e:
            req_body = kwargs.get("json") or kwargs.get("data")
            self.logs.append({
                "method": method.upper(),
                "url": url,
                "request_body": str(req_body) if req_body else None,
                "status_code": 500,
                "response_body": f"Network Error: {str(e)}"
            })
            raise

    def login(self, email, password):
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": email,
            "password": password
        }
        response = self._execute_request("POST", url, json=payload, timeout=10)
        if response.status_code == 200:
            self.token = response.json().get('access_token')
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return response

    def get(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self._execute_request("GET", url, **kwargs)

    def post(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self._execute_request("POST", url, data=data, json=json, **kwargs)

    def put(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self._execute_request("PUT", url, data=data, json=json, **kwargs)

    def delete(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self._execute_request("DELETE", url, **kwargs)
