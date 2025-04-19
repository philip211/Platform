
pkill -f "localtunnel"

echo "Starting new localtunnel for Mafia Chicago game..."
npx localtunnel --port 5173 --subdomain mafia-chicago-app

echo "Tunnel closed. Run this script again to restart the tunnel."
