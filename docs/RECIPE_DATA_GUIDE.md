# Recipe data guide

Recipe IDs use lowercase kebab-case and must remain stable. Every recipe needs a clear Korean name and description, category, difficulty, minutes, servings, local or absolute image URL, searchable tags, ingredients, ordered steps, and tips. Ingredient IDs should be reused consistently because fridge matching and shopping deduplication depend on them.

Steps should tell a beginner exactly what to cut, how large, which heat to use, and roughly how long to cook. For chicken and pork, explicitly tell the user to cook the center fully. Avoid medical claims and disease-specific diets.

When editing the Sheet, keep `tagsJson`, `ingredientsJson`, `stepsJson`, and `tipsJson` as valid JSON and keep `enabled` true for visible recipes. Mirror production-safe content into `data/recipes-fallback.json`.
