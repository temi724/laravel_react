# Fonts for server-rendered PDFs

Static Manrope files (Regular, SemiBold, Bold, ExtraBold) used by the DomPDF invoice
(`resources/views/admin/invoice-pdf.blade.php`). The website itself uses the variable
Manrope bundled through `@fontsource-variable/manrope`.

Manrope is licensed under the SIL Open Font License 1.1 (https://openfontlicense.org).
It has no naira sign, so the PDF template sets "₦" in DejaVu Sans, which DomPDF ships with.
