# Prompt2Slide AI refactor plan (mod_pptgen)

## Problem

Refactor `mod/pptgen` to: add photos where they help, add Anthropic as a provider, raise the slide limit to 28, offer 5 customizable formats with themes, fonts, font sizes, transitions and animations preserved.

## Current state (verified in code)

- `classes/generator.php`: `generate_ppt()` dispatches to `call_gemini`, `call_openai`, `call_custom`. Text only. `create_ppt_from_slides()` clones 20 template slides and fills `{{...}}` tokens. Transitions exist in the template (slide XML contains `transition`).
- `view.php:63` `maxslides` 20, `view.php:81` clamp to 20. `lang/en/pptgen.php:89` label says "(1-20)".
- `classes/form/prompt_form.php` and `templates/nes 2view.mustache` have no format or theme inputs.
- `settings.php` has provider setting, no Anthropic key or model.
- `template/template.pptx`: 20 slides, Calibri / Calibri Light theme, 44pt titles, 28pt bodies.
- Unrelated: `docs/keep-alive-plan.md` (tagged) is a separate keep-alive checklist; not part of this change.

## Proposed approach

1. **Providers:** add `anthropic` to `settings.php` (key + model) and `call_anthropic()` using the Messages API (`x-api-key`, `anthropic-version`, `max_tokens`, stop_reason `max_tokens` check). Endpoint and parameter names to be verified against Anthropic's official docs before coding.
2. **Slides to 28:** raise `maxslides` and clamp to 28 in `view.php`, label in `lang/en/pptgen.php`, and `max_completion_tokens` / `maxOutputTokens` scaled for 28 slides. Template gets slides 21–28 (same placeholder structure as slides 6–20), tokens `{{SLIDE_TITLE_n}}` / `{{SLIDE_BODY_n}}`.
3. **Five formats:** add a format selector (5 layouts), each a separate template file under `template/` with its own theme, font family, and font sizes. Cloning keeps each template's transitions and animation `<p:timing>` XML intact.
4. **Photos:** add an image step. Each image is placed at a modest size on the slide, and clicking it opens a full-size modal. Modal and images are rendered in the Moodle view; the PPTX gets the image as a picture shape with a relationship and `[Content_Types]` entry for each media type.
5. **Image source:** to be decided by the user (see questions).
6. **Naming:** the image feature is named "Prompt2Slide IMAGE AI" in UI strings.
7. Verify: PHP lint, stub harness, python-pptx checks (fonts, sizes, transitions preserved, image rels valid, no `{{` tokens), 28-slide count, then a live check. Live deploy only after approval.

## Todos

- anthropic-provider: add Anthropic settings and `call_anthropic()` (depends on endpoint verification)
- slide-limit-28: raise limit to 28 and expand template to 28 slides
- formats-5: five template formats with theme, fonts, sizes, transitions and animations intact (depends on slide-limit-28)
- image-ai: image source step, PPTX picture insertion, modal in view (depends on image source decision)
- verify-dev: harness and python-pptx checks for every format and slide count
- deploy-live: backup, SHA-256 match, live test (depends on verify-dev)

## Open questions

- Image source, and whether the plugin fetches images, generates them with AI, or both.
- Definition of the 5 formats (names and styles), or whether to derive them from the existing template and `powerpoint.pptx`.
- Scope of photo placement: AI decides per slide, or a user toggle.
- Anthropic model name to default to.
