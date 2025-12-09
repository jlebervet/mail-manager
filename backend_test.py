import requests
import sys
import json
from datetime import datetime

class MailManagerAPITester:
    def __init__(self, base_url="https://correspondnow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_data = {}

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test admin login
        admin_response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            {"email": "admin@mairie.fr", "password": "admin123"}
        )
        
        if admin_response and 'token' in admin_response:
            self.admin_token = admin_response['token']
            self.test_data['admin_user'] = admin_response['user']
        
        # Test user login
        user_response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            {"email": "user@mairie.fr", "password": "user123"}
        )
        
        if user_response and 'token' in user_response:
            self.user_token = user_response['token']
            self.test_data['regular_user'] = user_response['user']
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            {"email": "invalid@test.com", "password": "wrong"}
        )
        
        # Test get current user info
        if self.admin_token:
            self.run_test(
                "Get Current User Info",
                "GET",
                "auth/me",
                200,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )

    def test_services(self):
        """Test services endpoints"""
        print("\n🏢 Testing Services...")
        
        if not self.admin_token:
            print("❌ Skipping services tests - no admin token")
            return
        
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get services
        services_response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200,
            headers=admin_headers
        )
        
        if services_response:
            self.test_data['services'] = services_response
        
        # Create service
        service_data = {
            "name": "Test Service",
            "sub_services": [
                {"id": "sub1", "name": "Sub Service 1"},
                {"id": "sub2", "name": "Sub Service 2"}
            ]
        }
        
        created_service = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            service_data,
            admin_headers
        )
        
        if created_service:
            service_id = created_service['id']
            self.test_data['test_service_id'] = service_id
            
            # Update service
            updated_service_data = {
                "name": "Updated Test Service",
                "sub_services": [{"id": "sub1", "name": "Updated Sub Service"}]
            }
            
            self.run_test(
                "Update Service",
                "PUT",
                f"services/{service_id}",
                200,
                updated_service_data,
                admin_headers
            )
            
            # Delete service
            self.run_test(
                "Delete Service",
                "DELETE",
                f"services/{service_id}",
                200,
                headers=admin_headers
            )

    def test_correspondents(self):
        """Test correspondents endpoints"""
        print("\n👥 Testing Correspondents...")
        
        if not self.user_token:
            print("❌ Skipping correspondents tests - no user token")
            return
        
        user_headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Get correspondents
        correspondents_response = self.run_test(
            "Get Correspondents",
            "GET",
            "correspondents",
            200,
            headers=user_headers
        )
        
        if correspondents_response:
            self.test_data['correspondents'] = correspondents_response
        
        # Search correspondents
        self.run_test(
            "Search Correspondents",
            "GET",
            "correspondents",
            200,
            {"search": "test"},
            user_headers
        )
        
        # Create correspondent
        correspondent_data = {
            "name": "Test Correspondent",
            "email": "test@example.com",
            "organization": "Test Org",
            "phone": "+33123456789",
            "address": "123 Test Street"
        }
        
        created_correspondent = self.run_test(
            "Create Correspondent",
            "POST",
            "correspondents",
            200,
            correspondent_data,
            user_headers
        )
        
        if created_correspondent:
            correspondent_id = created_correspondent['id']
            self.test_data['test_correspondent_id'] = correspondent_id
            
            # Update correspondent
            updated_correspondent_data = {
                "name": "Updated Test Correspondent",
                "email": "updated@example.com"
            }
            
            self.run_test(
                "Update Correspondent",
                "PUT",
                f"correspondents/{correspondent_id}",
                200,
                updated_correspondent_data,
                user_headers
            )

    def test_mails(self):
        """Test mails endpoints"""
        print("\n📧 Testing Mails...")
        
        if not self.user_token or not self.test_data.get('correspondents') or not self.test_data.get('services'):
            print("❌ Skipping mails tests - missing dependencies")
            return
        
        user_headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Get mails
        mails_response = self.run_test(
            "Get Mails",
            "GET",
            "mails",
            200,
            headers=user_headers
        )
        
        if mails_response:
            self.test_data['mails'] = mails_response
        
        # Get mails with filters
        self.run_test(
            "Get Mails with Type Filter",
            "GET",
            "mails",
            200,
            {"type": "entrant"},
            user_headers
        )
        
        # Create mail if we have correspondent and service
        correspondents = self.test_data.get('correspondents', [])
        services = self.test_data.get('services', [])
        
        if correspondents and services:
            correspondent = correspondents[0]
            service = services[0]
            
            mail_data = {
                "type": "entrant",
                "subject": "Test Mail Subject",
                "content": "This is a test mail content",
                "correspondent_id": correspondent['id'],
                "correspondent_name": correspondent['name'],
                "service_id": service['id'],
                "service_name": service['name']
            }
            
            created_mail = self.run_test(
                "Create Mail",
                "POST",
                "mails",
                200,
                mail_data,
                user_headers
            )
            
            if created_mail:
                mail_id = created_mail['id']
                self.test_data['test_mail_id'] = mail_id
                
                # Get specific mail (auto-assignment test)
                mail_detail = self.run_test(
                    "Get Mail Detail (Auto-assignment)",
                    "GET",
                    f"mails/{mail_id}",
                    200,
                    headers=user_headers
                )
                
                # Update mail status
                update_data = {
                    "status": "traitement",
                    "comment": "Test status update"
                }
                
                self.run_test(
                    "Update Mail Status",
                    "PUT",
                    f"mails/{mail_id}",
                    200,
                    update_data,
                    user_headers
                )

    def test_users_admin_only(self):
        """Test users endpoints (admin only)"""
        print("\n👤 Testing Users (Admin Only)...")
        
        if not self.admin_token:
            print("❌ Skipping users tests - no admin token")
            return
        
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get users
        users_response = self.run_test(
            "Get Users",
            "GET",
            "users",
            200,
            headers=admin_headers
        )
        
        if users_response:
            self.test_data['users'] = users_response
        
        # Test user access with regular user token (should fail)
        if self.user_token:
            user_headers = {'Authorization': f'Bearer {self.user_token}'}
            self.run_test(
                "Get Users (Regular User - Should Fail)",
                "GET",
                "users",
                403,
                headers=user_headers
            )
        
        # Create new user
        new_user_data = {
            "name": "Test User",
            "email": "testuser@mairie.fr",
            "password": "testpass123",
            "role": "user"
        }
        
        created_user = self.run_test(
            "Create User",
            "POST",
            "auth/register",
            200,
            new_user_data,
            admin_headers
        )
        
        if created_user:
            user_id = created_user['id']
            self.test_data['test_user_id'] = user_id
            
            # Update user role
            self.run_test(
                "Update User Role",
                "PUT",
                f"users/{user_id}?role=admin",
                200,
                headers=admin_headers
            )
            
            # Delete user
            self.run_test(
                "Delete User",
                "DELETE",
                f"users/{user_id}",
                200,
                headers=admin_headers
            )

    def test_stats(self):
        """Test stats endpoint"""
        print("\n📊 Testing Stats...")
        
        if not self.user_token:
            print("❌ Skipping stats tests - no user token")
            return
        
        user_headers = {'Authorization': f'Bearer {self.user_token}'}
        
        stats_response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "stats",
            200,
            headers=user_headers
        )
        
        if stats_response:
            self.test_data['stats'] = stats_response

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if not self.admin_token:
            return
        
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Delete test correspondent
        if 'test_correspondent_id' in self.test_data:
            self.run_test(
                "Cleanup: Delete Test Correspondent",
                "DELETE",
                f"correspondents/{self.test_data['test_correspondent_id']}",
                200,
                headers=admin_headers
            )
        
        # Delete test mail
        if 'test_mail_id' in self.test_data:
            self.run_test(
                "Cleanup: Delete Test Mail",
                "DELETE",
                f"mails/{self.test_data['test_mail_id']}",
                200,
                headers=admin_headers
            )

    def run_all_tests(self):
        """Run all tests"""
        print(f"🚀 Starting Mail Manager API Tests")
        print(f"Backend URL: {self.base_url}")
        
        # Run tests in order
        self.test_authentication()
        self.test_services()
        self.test_correspondents()
        self.test_mails()
        self.test_users_admin_only()
        self.test_stats()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print results
        print(f"\n📊 Test Results:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MailManagerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())