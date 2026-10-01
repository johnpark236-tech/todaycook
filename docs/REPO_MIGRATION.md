# Snack edition repository migration

Target repository: `johnpark236-tech/today-mukji-snack`

Source:
- repository: `johnpark236-tech/todaycook`
- branch: `project/todayeat-snack`

Migration rule:
- Copy only the snack-edition branch tree.
- Do not copy the house-meal `main` branch.
- New repository default branch must be `main`.
- After copy, update any raw GitHub URLs in `apps-script/SeedData.gs` from the source branch to:
  `https://raw.githubusercontent.com/johnpark236-tech/today-mukji-snack/main/`
- Keep the 12 local snack illustrations under `assets/snacks/`.
- Re-run JavaScript syntax and recipe JSON checks after migration.
