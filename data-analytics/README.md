# Pulse80 Data Analytics

## Purpose

Analytics, data quality, transformation and reporting
logic for the Pulse80 platform.

## Structure

notebooks/    Exploratory analysis
src/          Production data logic
tests/        Automated tests
docs/         Data definitions and quality documentation
data/         Local datasets; never committed
reports/      Generated analytical outputs

## Setup

1. Create Python virtual environment
2. Install requirements
3. Obtain approved dataset
4. Store dataset under data/raw/
5. Create task branch
6. Run notebook
7. Commit work
8. Open PR

## Commit Message Convention

All data analytics and data engineering commits should follow **Conventional Commits** with a consistent emoji assigned to each commit type.

### Format

```text
<emoji> <type>(data): short description
```

Example:

```text
✨ feat(data): add employee dataset profiling
```

### Commit Types

| Type       | Emoji | Use                                                                                       |
| ---------- | ----- | ----------------------------------------------------------------------------------------- |
| `feat`     | ✨     | New analysis, transformation, metric, validation rule, visualisation, or data capability  |
| `fix`      | 🐛    | Fix incorrect analysis, transformation logic, parsing, calculations, or data handling     |
| `docs`     | 📝    | Documentation, findings, data dictionaries, relationship documentation, or README changes |
| `test`     | ✅     | Tests, validation tests, data-quality assertions, or automated checks                     |
| `refactor` | ♻️    | Restructure existing analytics code without changing its intended behaviour               |
| `chore`    | 🔧    | Project setup, dependencies, folder structure, configuration, tooling, or maintenance     |
| `perf`     | ⚡     | Improve query, transformation, notebook, or pipeline performance                          |
| `ci`       | 👷    | CI/CD, automated checks, GitHub Actions, or data pipeline automation                      |
| `build`    | 📦    | Build system, package management, Python environment, or dependency changes               |
| `revert`   | ⏪     | Revert a previous commit                                                                  |

### Examples

```text
✨ feat(data): add employee dataset profiling
✨ feat(data): add screening descriptive statistics
✨ feat(data): add participation visualisations
✨ feat(data): validate programme service relationships

🐛 fix(data): correct screening date parsing
🐛 fix(data): handle duplicate participation records
🐛 fix(data): correct risk score calculation

📝 docs(data): document employee EDA findings
📝 docs(data): add analytics data dictionary
📝 docs(data): document dataset relationships

✅ test(data): add employee identifier validation
✅ test(data): add screening null value checks
✅ test(data): validate referral foreign keys

♻️ refactor(data): extract reusable cleaning functions
♻️ refactor(data): standardise EDA notebook structure

🔧 chore(data): scaffold analytics workspace
🔧 chore(data): update analytics gitignore rules
🔧 chore(data): configure Jupyter workspace

⚡ perf(data): optimise screening aggregation
⚡ perf(data): reduce transformation runtime

👷 ci(data): add notebook validation workflow
👷 ci(data): run analytics tests on pull requests

📦 build(data): add pandas and matplotlib dependencies
📦 build(data): update Python analytics dependencies

⏪ revert(data): revert screening transformation changes
```

### Commit Guidelines

Commit messages should:

* Be written in the imperative form.
* Clearly describe what changed.
* Keep each commit focused on one meaningful change.
* Use the same emoji for the same commit type every time.
* Use `data` as the scope for general analytics work.
* Use a more specific scope where useful, such as `eda`, `pipeline`, `validation`, or `metrics`.

Examples with more specific scopes:

```text
✨ feat(eda): add organisations dataset profiling
✨ feat(metrics): add workforce participation rate
✨ feat(pipeline): transform screening records
✅ test(validation): add practitioner ID checks
🐛 fix(pipeline): handle missing screening dates
📝 docs(eda): document referral analysis findings
```

Avoid vague commit messages such as:

```text
updated notebook
fixed stuff
EDA done
changes
final version
```

Prefer:

```text
✨ feat(eda): analyse employee participation distributions
🐛 fix(data): correct invalid referral status mapping
📝 docs(data): document screening data quality findings
```
