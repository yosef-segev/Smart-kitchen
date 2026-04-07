import requests
import sys
import json
from datetime import datetime, timedelta

class KitchenAppAPITester:
    def __init__(self, base_url="https://freshtrack-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        data = {
            "email": test_email,
            "password": "testpass123",
            "name": "Test User"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/register", json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('email') == test_email and result.get('name') == "Test User":
                    self.log_test("User Registration", True)
                    return True, test_email, "testpass123"
                else:
                    self.log_test("User Registration", False, "Invalid response data")
            else:
                self.log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
        
        return False, None, None

    def test_auth_login(self, email, password):
        """Test user login"""
        data = {"email": email, "password": password}
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login", json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('email') == email:
                    # Check if cookies are set
                    cookies = self.session.cookies
                    if 'access_token' in cookies and 'refresh_token' in cookies:
                        self.log_test("User Login", True)
                        return True
                    else:
                        self.log_test("User Login", False, "Cookies not set properly")
                else:
                    self.log_test("User Login", False, "Invalid response data")
            else:
                self.log_test("User Login", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_me(self):
        """Test get current user"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            if response.status_code == 200:
                result = response.json()
                if result.get('email') and result.get('name'):
                    self.log_test("Get Current User", True)
                    return True
                else:
                    self.log_test("Get Current User", False, "Invalid user data")
            else:
                self.log_test("Get Current User", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
        
        return False

    def test_inventory_create(self):
        """Test creating inventory item"""
        expiry_date = (datetime.now() + timedelta(days=5)).isoformat()
        data = {
            "name": "Test Tomatoes",
            "category": "Vegetables",
            "quantity": 2.5,
            "unit": "kg",
            "expiration_date": expiry_date
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/inventory", json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('name') == "Test Tomatoes" and result.get('id'):
                    self.log_test("Create Inventory Item", True)
                    return True, result['id']
                else:
                    self.log_test("Create Inventory Item", False, "Invalid response data")
            else:
                self.log_test("Create Inventory Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Inventory Item", False, f"Exception: {str(e)}")
        
        return False, None

    def test_inventory_get(self):
        """Test getting inventory list"""
        try:
            response = self.session.get(f"{self.base_url}/api/inventory")
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Get Inventory List", True)
                    return True, result
                else:
                    self.log_test("Get Inventory List", False, "Response is not a list")
            else:
                self.log_test("Get Inventory List", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Inventory List", False, f"Exception: {str(e)}")
        
        return False, []

    def test_inventory_update(self, item_id):
        """Test updating inventory item"""
        expiry_date = (datetime.now() + timedelta(days=3)).isoformat()
        data = {
            "name": "Updated Tomatoes",
            "category": "Vegetables",
            "quantity": 1.5,
            "unit": "kg",
            "expiration_date": expiry_date
        }
        
        try:
            response = self.session.put(f"{self.base_url}/api/inventory/{item_id}", json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('name') == "Updated Tomatoes":
                    self.log_test("Update Inventory Item", True)
                    return True
                else:
                    self.log_test("Update Inventory Item", False, "Item not updated properly")
            else:
                self.log_test("Update Inventory Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Update Inventory Item", False, f"Exception: {str(e)}")
        
        return False

    def test_inventory_delete(self, item_id):
        """Test deleting inventory item"""
        try:
            response = self.session.delete(f"{self.base_url}/api/inventory/{item_id}")
            if response.status_code == 200:
                self.log_test("Delete Inventory Item", True)
                return True
            else:
                self.log_test("Delete Inventory Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delete Inventory Item", False, f"Exception: {str(e)}")
        
        return False

    def test_shopping_list_create(self):
        """Test creating shopping list item"""
        data = {
            "name": "Test Milk",
            "category": "Dairy",
            "quantity": 1,
            "unit": "L"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/shopping-list", json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get('name') == "Test Milk" and result.get('id'):
                    self.log_test("Create Shopping Item", True)
                    return True, result['id']
                else:
                    self.log_test("Create Shopping Item", False, "Invalid response data")
            else:
                self.log_test("Create Shopping Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Shopping Item", False, f"Exception: {str(e)}")
        
        return False, None

    def test_shopping_list_get(self):
        """Test getting shopping list"""
        try:
            response = self.session.get(f"{self.base_url}/api/shopping-list")
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    self.log_test("Get Shopping List", True)
                    return True, result
                else:
                    self.log_test("Get Shopping List", False, "Response is not a list")
            else:
                self.log_test("Get Shopping List", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Shopping List", False, f"Exception: {str(e)}")
        
        return False, []

    def test_shopping_list_toggle(self, item_id):
        """Test toggling shopping item purchased status"""
        try:
            response = self.session.put(f"{self.base_url}/api/shopping-list/{item_id}/toggle", json={})
            if response.status_code == 200:
                result = response.json()
                if 'purchased' in result:
                    self.log_test("Toggle Shopping Item", True)
                    return True
                else:
                    self.log_test("Toggle Shopping Item", False, "Invalid response data")
            else:
                self.log_test("Toggle Shopping Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Toggle Shopping Item", False, f"Exception: {str(e)}")
        
        return False

    def test_shopping_list_delete(self, item_id):
        """Test deleting shopping item"""
        try:
            response = self.session.delete(f"{self.base_url}/api/shopping-list/{item_id}")
            if response.status_code == 200:
                self.log_test("Delete Shopping Item", True)
                return True
            else:
                self.log_test("Delete Shopping Item", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delete Shopping Item", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics(self):
        """Test analytics endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics")
            if response.status_code == 200:
                result = response.json()
                required_keys = ['frequent_items', 'total_inventory', 'shopping_list_count', 'expiring_count']
                if all(key in result for key in required_keys):
                    self.log_test("Get Analytics", True)
                    return True
                else:
                    self.log_test("Get Analytics", False, f"Missing keys in response: {result}")
            else:
                self.log_test("Get Analytics", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Analytics", False, f"Exception: {str(e)}")
        
        return False

    def test_recipe_generation(self):
        """Test AI recipe generation"""
        try:
            # Test with empty ingredients (should use fresh inventory)
            response = self.session.post(f"{self.base_url}/api/recipes/generate", json={})
            if response.status_code == 200:
                result = response.json()
                required_keys = ['recipe_name', 'ingredients', 'instructions']
                if all(key in result for key in required_keys):
                    self.log_test("Generate Recipe (Auto)", True)
                    return True
                else:
                    self.log_test("Generate Recipe (Auto)", False, f"Missing keys in response: {result}")
            elif response.status_code == 400:
                # No ingredients available is acceptable
                self.log_test("Generate Recipe (Auto)", True, "No ingredients available (expected)")
                return True
            else:
                self.log_test("Generate Recipe (Auto)", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Generate Recipe (Auto)", False, f"Exception: {str(e)}")
        
        return False

    def test_recipe_generation_with_ingredients(self):
        """Test AI recipe generation with specific ingredients"""
        data = {"ingredients": ["tomatoes", "onions", "garlic"]}
        
        try:
            response = self.session.post(f"{self.base_url}/api/recipes/generate", json=data)
            if response.status_code == 200:
                result = response.json()
                required_keys = ['recipe_name', 'ingredients', 'instructions']
                if all(key in result for key in required_keys):
                    self.log_test("Generate Recipe (Custom)", True)
                    return True
                else:
                    self.log_test("Generate Recipe (Custom)", False, f"Missing keys in response: {result}")
            else:
                self.log_test("Generate Recipe (Custom)", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Generate Recipe (Custom)", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_logout(self):
        """Test user logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            if response.status_code == 200:
                # Check if cookies are cleared
                cookies = self.session.cookies
                if 'access_token' not in cookies or not cookies['access_token']:
                    self.log_test("User Logout", True)
                    return True
                else:
                    self.log_test("User Logout", False, "Cookies not cleared properly")
            else:
                self.log_test("User Logout", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Logout", False, f"Exception: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Kitchen App API Tests...")
        print("=" * 50)
        
        # Test authentication flow
        success, email, password = self.test_auth_register()
        if not success:
            print("❌ Registration failed, stopping tests")
            return self.get_summary()
        
        if not self.test_auth_login(email, password):
            print("❌ Login failed, stopping tests")
            return self.get_summary()
        
        if not self.test_auth_me():
            print("❌ Get current user failed")
        
        # Test inventory CRUD
        success, item_id = self.test_inventory_create()
        if success and item_id:
            self.test_inventory_get()
            self.test_inventory_update(item_id)
            self.test_inventory_delete(item_id)
        
        # Test shopping list CRUD
        success, shopping_id = self.test_shopping_list_create()
        if success and shopping_id:
            self.test_shopping_list_get()
            self.test_shopping_list_toggle(shopping_id)
            self.test_shopping_list_delete(shopping_id)
        
        # Test analytics
        self.test_analytics()
        
        # Test AI recipe generation (may be slow)
        print("🤖 Testing AI recipe generation (this may take a few seconds)...")
        self.test_recipe_generation()
        self.test_recipe_generation_with_ingredients()
        
        # Test logout
        self.test_auth_logout()
        
        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("❌ Some tests failed:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    tester = KitchenAppAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())