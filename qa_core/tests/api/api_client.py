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

    def login(self, email, password):
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": email,
            "password": password
        }
        response = self.session.post(url, json=payload, timeout=10)
        self._log_request(response)
        if response.status_code == 200:
            self.token = response.json().get('access_token')
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return response

    def get(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, **kwargs)
        return self._log_request(response)

    def post(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.post(url, data=data, json=json, **kwargs)
        return self._log_request(response)

    def put(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.put(url, data=data, json=json, **kwargs)
        return self._log_request(response)

    def delete(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.delete(url, **kwargs)
        return self._log_request(response)
