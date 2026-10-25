# Profit Leak Analyzer

An academic prototype of a financial analytics product for Pakistani cash-on-delivery sellers. It presents a static marketing site and a sample reconciliation dashboard that illustrate how hidden courier costs, RTO losses and settlement gaps could be traced back to source rows.

## Run locally

1. `npm install`
2. `npm run dev`
3. Open the local URL printed by Vite.

To check the production build, run `npm run build` followed by `npm run preview`.

## Future work

See [FUTURE_TASKS.md](FUTURE_TASKS.md) for the planned upgrade of Vite, Tailwind CSS, React Router, and related dependencies, plus the task to code-split the production bundle. The current versions are pinned because the site was tested against them.

## Prototype scope

- This is a static React + TypeScript + Vite demonstration. There is no backend, authentication, file upload, live analysis, payment flow or stored request.
- The demo request form validates entries in the browser only. Nothing is transmitted, saved or emailed.
- All dashboard figures and findings are fictional sample data. A potential discrepancy is not a confirmed loss.
- The theme toggle applies to the current session and resets on reload.

Review the in-app Privacy Policy and Terms of Service for the full prototype disclosures.
