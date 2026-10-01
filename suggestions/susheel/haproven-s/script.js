
        /* =========================
           HELPERS
        ========================= */

        function money(value) {
            return "₹" + Math.round(value).toLocaleString("en-IN");
        }

        function formatDate(value) {
            if (!value) return "—";

            const date = new Date(value + "T00:00:00");

            if (Number.isNaN(date.getTime())) {
                return "—";
            }

            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }

        /* =========================
           UPDATE DOCUMENT
        ========================= */

        function updateDocument() {

            const getValue = id =>
                document.getElementById(id).value.trim();

            const reference = getValue("reference");
            const docDate = getValue("docDate");
            const studentName = getValue("studentName");
            const studentId = getValue("studentId");
            const institute = getValue("institute");
            const course = getValue("course");
            const contact = getValue("contact");

            const monthlyFee = Math.max(
                0,
                Number(document.getElementById("monthlyFee").value) || 0
            );

            const months = Math.max(
                0,
                Math.floor(Number(document.getElementById("months").value) || 0)
            );

            const percent = Math.min(
                100,
                Math.max(
                    0,
                    Number(document.getElementById("supportPercent").value) || 0
                )
            );

            const startDate = getValue("startDate");
            const endDate = getValue("endDate");

            /* CALCULATIONS */

            const normalTotal = monthlyFee * months;
            const totalSupport = normalTotal * percent / 100;
            const monthlySupport = months ? totalSupport / months : 0;
            const studentTotal = normalTotal - totalSupport;
            const studentMonthly = months ? studentTotal / months : 0;

            /* STUDENT INFORMATION */

            document.getElementById("showReference").textContent =
                reference || "—";

            document.getElementById("showDocDate").textContent =
                formatDate(docDate);

            document.getElementById("showStudentName").textContent =
                studentName || "—";

            document.getElementById("showStudentId").textContent =
                studentId || "—";

            document.getElementById("showInstitute").textContent =
                institute || "—";

            document.getElementById("showCourse").textContent =
                course || "—";

            document.getElementById("showContact").textContent =
                contact || "—";

            document.getElementById("showStart").textContent =
                formatDate(startDate);

            document.getElementById("showEnd").textContent =
                formatDate(endDate);

            document.getElementById("showPercent").textContent =
                percent + "%";

            /* FEE SUMMARY */

            document.getElementById("showMonthly").textContent =
                money(monthlyFee);

            document.getElementById("showMonths").textContent =
                months;

            document.getElementById("showNormalTotal").textContent =
                money(normalTotal);

            document.getElementById("showSupport").textContent =
                money(totalSupport);

            /* PAYMENT TABLE */

            document.getElementById("tableMonthly").textContent =
                money(monthlyFee);

            document.getElementById("tableMonthlySupport").textContent =
                money(monthlySupport);

            document.getElementById("tableStudentMonthly").textContent =
                money(studentMonthly);

            document.getElementById("tableNormalTotal").textContent =
                money(normalTotal);

            document.getElementById("tableSupport").textContent =
                money(totalSupport);

            document.getElementById("tableStudentTotal").textContent =
                money(studentTotal);

            /* SUPPORT BOX */

            document.getElementById("boxSupport").textContent =
                money(totalSupport);
        }

        /* =========================
           INPUT LISTENERS
        ========================= */

        document.querySelectorAll(".editor input").forEach(input => {
            input.addEventListener("input", updateDocument);
            input.addEventListener("change", updateDocument);
        });

        /* =========================
           RESET FORM
        ========================= */

        function resetForm() {

            document.getElementById("reference").value =
                "HAP-FS-2026-001";

            document.getElementById("docDate").value =
                "2026-09-23";

            document.getElementById("studentName").value =
                "Student Name";

            document.getElementById("studentId").value =
                "STU-001";

            document.getElementById("institute").value =
                "Institute Name";

            document.getElementById("course").value =
                "Course Name";

            document.getElementById("contact").value =
                "+91 XXXXX XXXXX";

            document.getElementById("monthlyFee").value = 500;

            document.getElementById("months").value = 6;

            document.getElementById("supportPercent").value = 12;

            document.getElementById("startDate").value =
                "2026-09-01";

            document.getElementById("endDate").value =
                "2027-02-28";

            updateDocument();
        }

        /* =========================
           INITIAL LOAD
        ========================= */

        // updateDocument();