# Security Policy

Please don't open public issues for vulnerabilities that could expose local process information, signing material, release credentials, or contributor data.

Until a dedicated security contact is published, use GitHub's private vulnerability reporting feature for this repository. Don't include certificates, private keys, provisioning profiles, or unredacted benchmark notes in reports.

RecorderBench is intentionally not sandboxed so it can inspect read-only resource metrics of the selected application process family. It doesn't require root access and should never ask for administrator credentials.
