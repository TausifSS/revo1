# Firestore startup fix

The backend compiled successfully, but the original startup failure was caused by the machine being unable to resolve `firestore.googleapis.com` (`UnknownHostException`).

This version disables startup database seeding by default, so a temporary Firestore/DNS outage no longer kills the Spring Boot application.

## Enable seeding
Set:
`DATABASE_SEED_ENABLED=true`

## Still required
Firestore itself must be reachable for API operations that read/write data. If you still see
`Unable to resolve host firestore.googleapis.com`, fix the local DNS/network/VPN/firewall issue.

On Windows, useful checks:
- `nslookup firestore.googleapis.com`
- `ping firestore.googleapis.com`
- restart/disable VPN or proxy temporarily
- try another network/hotspot
- flush DNS with `ipconfig /flushdns`

Do not commit `serviceAccountKey.json` or `.env` to Git.
