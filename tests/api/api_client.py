import requests
import os

class APIClient:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv('API_URL', 'http://backend:8000')
        self.session = requests.Session()
        self.token = None

    def login(self, email, password):
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": email,
            "password": password
        }
        response = self.session.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            self.token = response.json().get('access_token')
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return response

    def get(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self.session.get(url, **kwargs)

    def post(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self.session.post(url, data=data, json=json, **kwargs)

    def put(self, endpoint, data=None, json=None, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self.session.put(url, data=data, json=json, **kwargs)

    def delete(self, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        return self.session.delete(url, **kwargs)
