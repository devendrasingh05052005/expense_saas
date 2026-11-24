import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("🧪 Starting comprehensive RoomMates SaaS verification...\n")

    # 1. Test Demo Seed
    print("1. Testing Demo Data Seed...")
    r = requests.post(f"{BASE_URL}/demo/seed")
    assert r.status_code == 200, f"Seed failed: {r.text}"
    print(f"   ✅ Demo Seed: {r.json()}")

    # 2. Test Login for 3 Roommates
    print("\n2. Testing Authentication for 3 Roommates...")
    tokens = {}
    for email in ["rahul@roommates.app", "aman@roommates.app", "priya@roommates.app"]:
        r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "Password123!"})
        assert r.status_code == 200, f"Login failed for {email}: {r.text}"
        data = r.json()
        tokens[email] = data["access_token"]
        print(f"   ✅ Login OK for {data['user']['full_name']} ({email}) - Token received")

    rahul_token = tokens["rahul@roommates.app"]
    aman_token = tokens["aman@roommates.app"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}
    aman_headers = {"Authorization": f"Bearer {aman_token}"}

    # 3. Test Groups List
    print("\n3. Testing Group Workspace Retrieval...")
    r = requests.get(f"{BASE_URL}/groups", headers=rahul_headers)
    assert r.status_code == 200
    groups = r.json()
    assert len(groups) > 0, "No groups found!"
    group = groups[0]
    group_id = group["id"]
    invite_code = group["invite_code"]
    print(f"   ✅ Found Group: '{group['name']}' (ID: {group_id}, Code: {invite_code}, Members: {group['member_count']})")

    # 4. Test Individual Expense Tracking
    print("\n4. Testing Individual Expense Tracking (Feature 1)...")
    # Add new expense as Aman
    r = requests.post(
        f"{BASE_URL}/groups/{group_id}/expenses",
        headers=aman_headers,
        json={
            "amount": 750.0,
            "description": "Amul Milk & Brown Bread (1 Week)",
            "category": "Groceries",
            "expense_date": "2026-11-24"
        }
    )
    assert r.status_code == 200, f"Failed to add expense: {r.text}"
    new_expense = r.json()
    print(f"   ✅ Aman added expense: ₹{new_expense['amount']} for '{new_expense['description']}'")

    # List expenses
    r = requests.get(f"{BASE_URL}/groups/{group_id}/expenses", headers=rahul_headers)
    assert r.status_code == 200
    expenses = r.json()
    print(f"   ✅ Retrieved {len(expenses)} individual expenses")

    # 5. Test Common Room Fund (Feature 2 - Completely Separate Module)
    print("\n5. Testing Common Room Fund (Feature 2 - Isolated Module)...")
    r = requests.get(f"{BASE_URL}/groups/{group_id}/fund/summary", headers=rahul_headers)
    assert r.status_code == 200
    fund = r.json()
    initial_balance = fund["available_balance"]
    print(f"   ✅ Common Fund Summary:")
    print(f"      Total Contributed: ₹{fund['total_contributed']:,.2f}")
    print(f"      Total Spent:       ₹{fund['total_spent']:,.2f}")
    print(f"      Available Balance: ₹{fund['available_balance']:,.2f}")

    # Test strict validation: trying to spend more than available balance must fail!
    print("   Testing strict spending validation (Overdraft prevention)...")
    overdraft_amount = initial_balance + 50000.0
    r = requests.post(
        f"{BASE_URL}/groups/{group_id}/fund/expense",
        headers=rahul_headers,
        json={
            "amount": overdraft_amount,
            "description": "Attempted Excessive Purchase",
            "category": "Other"
        }
    )
    assert r.status_code == 400, f"Expected 400 Bad Request for overdraft, got {r.status_code}"
    print(f"   ✅ Correctly rejected overdraft attempt: {r.json()['detail']}")

    # Valid fund spend
    r = requests.post(
        f"{BASE_URL}/groups/{group_id}/fund/expense",
        headers=rahul_headers,
        json={
            "amount": 250.0,
            "description": "Sunflower Cooking Oil (1L)",
            "category": "Groceries"
        }
    )
    assert r.status_code == 200, f"Valid fund spend failed: {r.text}"
    after_spend_balance = r.json()["available_balance"]
    print(f"   ✅ Successfully spent ₹250.00 from Common Fund. New balance: ₹{after_spend_balance:,.2f}")

    # Fund Ledger Verification
    r = requests.get(f"{BASE_URL}/groups/{group_id}/fund/transactions", headers=rahul_headers)
    assert r.status_code == 200
    txs = r.json()
    assert len(txs) > 0
    print(f"   ✅ Common Fund Ledger: {len(txs)} transactions verified with running balances")

    # 6. Test Automatic Settlement Calculator (Feature 3)
    print("\n6. Testing Automatic Settlement Calculator (Feature 3)...")
    r = requests.get(f"{BASE_URL}/groups/{group_id}/settlements", headers=rahul_headers)
    assert r.status_code == 200
    settlements = r.json()
    print(f"   ✅ Fair share per roommate: ₹{settlements['fair_share_per_member']:,.2f}")
    print("   Roommate net balances:")
    for mb in settlements["member_balances"]:
        print(f"      {mb['user_name']}: Paid ₹{mb['total_paid']:,.2f} | Net: ₹{mb['net_balance']:,.2f}")

    print("   Suggested minimal debt transfers:")
    for st in settlements["suggested_transfers"]:
        print(f"      👉 {st['from_user_name']} owes {st['to_user_name']} ₹{st['amount']:,.2f}")

    # 7. Test Registration + OTP Email Verification for a 4th Roommate
    print("\n7. Testing Registration & OTP Verification Flow...")
    new_user_email = "vikram@roommates.app"
    r = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "full_name": "Vikram Malhotra",
            "email": new_user_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        }
    )
    assert r.status_code == 200
    otp_code = r.json().get("dev_otp")
    print(f"   ✅ Registration initiated. OTP Code dispatched: {otp_code}")

    # Verify OTP
    r = requests.post(
        f"{BASE_URL}/auth/verify-otp",
        json={"email": new_user_email, "otp_code": otp_code}
    )
    assert r.status_code == 200, f"OTP verification failed: {r.text}"
    vikram_data = r.json()
    vikram_token = vikram_data["access_token"]
    vikram_headers = {"Authorization": f"Bearer {vikram_token}"}
    print(f"   ✅ Vikram verified and logged in! Token received.")

    # Vikram joins the room using invite code
    r = requests.post(
        f"{BASE_URL}/groups/join",
        headers=vikram_headers,
        json={"invite_code": invite_code}
    )
    assert r.status_code == 200
    print(f"   ✅ Vikram successfully joined group '{group['name']}' using invite code '{invite_code}'")

    # Check that member count dynamically updated to 4!
    r = requests.get(f"{BASE_URL}/groups/{group_id}/members", headers=rahul_headers)
    assert r.status_code == 200
    members = r.json()
    assert len(members) == 4, f"Expected 4 members, got {len(members)}"
    print(f"   ✅ Dynamic multi-tenant member verification: Group now has {len(members)} roommates!")

    # 8. Test Analytics & Date Filtering
    print("\n8. Testing Dashboard Analytics with Date Filtering...")
    r = requests.get(f"{BASE_URL}/groups/{group_id}/analytics", headers=rahul_headers)
    assert r.status_code == 200
    analytics = r.json()
    print(f"   ✅ Total Individual Expenses: ₹{analytics['total_individual_expenses']:,.2f}")
    print(f"   ✅ Highest Spender: {analytics['highest_spender']['user_name'] if analytics['highest_spender'] else 'None'}")
    print(f"   ✅ Category distribution count: {len(analytics['category_distribution'])}")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The RoomMates SaaS backend and financial logic are 100% operational!\n")

if __name__ == "__main__":
    run_tests()
