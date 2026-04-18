import json
import os
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

# Create a directory to save the payloads for offline study
os.makedirs("payloads", exist_ok=True)

@app.route('/webhook', methods=['POST'])
def github_webhook():
    """
    Catches webhooks from GitHub, prints a summary, and saves the full 
    JSON payload to a local file so you can study its structure.
    """
    # 1. Capture the Event Type (e.g., 'check_run', 'pull_request')
    event_type = request.headers.get('X-GitHub-Event', 'unknown_event')
    
    # 2. Parse the JSON body
    payload = request.json
    if not payload:
        return jsonify({"msg": "No JSON payload received"}), 400

    # 3. Print a quick summary to the terminal
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🛎️  Received: {event_type}")
    
    # Look for 'check_run' specific data
    if event_type == 'check_run':
        check_run = payload.get('check_run', {})
        name = check_run.get('name', 'N/A')
        status = check_run.get('status', 'N/A')
        conclusion = check_run.get('conclusion', 'N/A')
        print(f"   Name: '{name}' | Status: {status} | Conclusion: {conclusion}")

    # 4. Save the full payload strictly for research and analysis
    filename = f"payloads/webhook_{event_type}_{datetime.now().strftime('%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(payload, f, indent=4)
        
    print(f"   💾 Saved full payload to {filename}")

    # 5. Tell GitHub we received it successfully (otherwise it will retry)
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    print("🚀 Local Webhook Listener booting up...")
    print("Listening on http://localhost:5000/webhook")
    print("Use ngrok to expose this to GitHub: ngrok http 5000")
    # Run the server
    app.run(port=5000)
