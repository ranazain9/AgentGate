import requests
import json
import time
import sys

# ==========================================
# AGENTGATE DEMO: EXTERNAL PYTHON AGENT
# ==========================================

# 1. Configuration
# Note: Ensure you have an agent named "Marketing Executive" registered in the UI.
AGENT_NAME = "marketing" 
API_KEY = "3981b60a-45df-4aea-8f6a-35066b21e71"
WEBHOOK_URL = "https://ysacunhmuyehjordjdbl.supabase.co/functions/v1/submit-proposal"

# Simulate an autonomous LangChain/AutoGPT loop
def simulate_thinking():
    print(f"🤖 [Agent: {AGENT_NAME}] Initializing autonomous marketing routine...")
    time.sleep(1.5)
    print("🧠 Analyzing Q3 user engagement metrics...")
    time.sleep(1)
    print("⚠️ Detected 15% drop in conversion rates. Formulating counter-strategy.")
    time.sleep(1.5)
    print("🛠️ Generating promotional email copy using GPT-4...")
    time.sleep(2)
    print("📁 Accessing Zendesk CRM to retrieve all user email addresses (n=850,234)...")
    time.sleep(1.5)
    print("🎯 Strategy finalized: Execute 50% discount blast to entire userbase.")
    time.sleep(1)

simulate_thinking()

# 2. The Dangerous Action the Agent wants to take
proposed_action = "Execute mass email campaign: '50% OFF EVERYTHING' to 850,234 users via SendGrid API."
risk_justification = "Our conversion rates are down. A massive discount blast will immediately boost Q3 revenue, despite exceeding my daily allocated promotional budget of $500."

print(f"\n🚀 Attempting to execute action: {proposed_action}")
print("🔒 ACTION INTERCEPTED BY AGENTGATE FIREWALL. Requesting permission...")
time.sleep(2)

# 3. Ask AgentGate for permission
try:
    response = requests.post(
        WEBHOOK_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "agentName": AGENT_NAME,
            "action": proposed_action,
            "riskJustification": risk_justification
        }
    )
    
    result = response.json()
    
    # 4. Handle the Decision
    if response.status_code == 200 and result.get("status") == "APPROVED":
        print("\n✅ SUCCESS: AgentGate Sentry Auto-Approved the action!")
        print("🤖 Sending 850,234 emails now...")
        
    elif response.status_code == 202 and result.get("status") == "PENDING_APPROVAL":
        print("\n⏳ BLOCKED: AgentGate Sentry AI evaluated the action as HIGH RISK!")
        print("🚨 Reason: Mass blast exceeds budget constraints and requires human sign-off.")
        print("👤 Awaiting Human Approval on the AgentGate Dashboard...")
        
        # Simulate polling
        for i in range(10):
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(1)
            
    else:
        print(f"\n❌ HTTP {response.status_code}")
        print(f"❌ ERROR JSON: {result}")

except Exception as e:
    print(f"\n❌ Connection Error: {str(e)}")
