<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import { toast } from "svelte-sonner";
    import * as Accordion from "$lib/components/ui/accordion";
    import { jsPDF } from "jspdf";
    import html2canvas from "html2canvas-pro";

    /**
     * ResumePane
     * - Scrollable container to house your resume-related components.
     * - No mock data; just structure and slots for you to populate.
     *
     * Props:
     * - className: append your own classes to customize the container.
     */
    export let className: string = "";

    const currentYear = new Date().getFullYear();
    const yearsOfExperience = currentYear - 2019;

    async function exportToPDF() {
        const element = document.querySelector('[aria-label="Resume"]');
        if (!element) return;

        // Clone the element for manipulation
        const clone = element.cloneNode(true) as HTMLElement;

        // Apply dark theme
        clone.style.backgroundColor = "#0a0a0a";
        clone.style.color = "#ffffff";

        // Replace buttons with text links
        const buttons = clone.querySelectorAll("button");
        buttons.forEach((button) => {
            if (button.textContent?.includes("Export PDF")) {
                // Remove the export button entirely
                button.remove();
            } else {
                // Replace other buttons with text links
                const text = button.textContent || "";
                const href = button.getAttribute("href") || "";
                const link = document.createElement("a");
                link.textContent = text;
                link.style.color = "#60a5fa";
                link.style.textDecoration = "underline";
                if (href) {
                    link.setAttribute("href", href);
                }
                button.parentNode?.replaceChild(link, button);
            }
        });

        // Adjust text colors for dark theme
        const textElements = clone.querySelectorAll(".text-muted-foreground");
        textElements.forEach((el) => {
            (el as HTMLElement).style.color = "#d1d5db";
        });

        // Make headings white
        const headings = clone.querySelectorAll("h1, h2, h3, h4, h5, h6");
        headings.forEach((heading) => {
            (heading as HTMLElement).style.color = "#ffffff";
        });

        // Temporarily add to document for capture
        clone.style.position = "absolute";
        clone.style.left = "-9999px";
        clone.style.top = "0";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#0a0a0a",
        });

        // Clean up
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save("Essam_Gouda_Resume.pdf");
        toast("PDF exported successfully!");
    }
</script>

<section
    aria-label="Resume"
    class={`h-full w-full overflow-auto ${className}`}
    {...$$restProps}
>
    <!-- Main resume content area -->
    <div class="mx-auto w-full space-y-6 px-4 py-6 md:px-6">
        <div class="flex items-center gap-4">
            <Avatar.Root class="h-24 w-24">
                <Avatar.Image src="/logo.png" alt="Essam Gouda" />
                <Avatar.Fallback>EG</Avatar.Fallback>
            </Avatar.Root>
            <div class="space-y-1">
                <h1 class="text-3xl font-bold">Essam Gouda</h1>
                <p class="text-muted-foreground">ML Engineer</p>
                <div class="flex items-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        href="https://github.com/essamgouda97"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <img
                            src="/portfolio/github-logo.png"
                            alt="GitHub"
                            class="size-4"
                        />
                        GitHub
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => {
                            navigator.clipboard.writeText(
                                "essamgouda97@gmail.com",
                            );
                            toast("Email copied to clipboard!");
                        }}
                    >
                        <img
                            src="/portfolio/mail-logo.png"
                            alt="Email"
                            class="size-4"
                        />
                        Email
                    </Button>
                    <Button variant="default" size="sm" onclick={exportToPDF}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="mr-2"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                            ></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export PDF
                    </Button>
                </div>
            </div>
        </div>
        <div class="space-y-4">
            <p class="text-muted-foreground text-lg">
                Driven by the saying <b
                    >"Learn something about everything and everything about
                    something"</b
                >, I am a passionate and fast-learning engineer. I love coding
                in Python
                <img
                    src="/portfolio/python-logo.png"
                    alt="Python"
                    class="mx-1 inline h-6 w-6 rounded-full bg-black"
                />
                and Rust
                <img
                    src="/portfolio/rust-logo.png"
                    alt="Rust"
                    class="mx-1 inline h-6 w-6 rounded-full bg-black"
                />
                and am always eager to feed my curiosity.
            </p>
        </div>
        <div class="space-y-4">
            <p class="text-muted-foreground text-lg">
                <b>Years of experience:</b>
                {yearsOfExperience}
            </p>
        </div>
        <h3
            class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Education
        </h3>
        <div class="space-y-4">
            <div class="flex justify-between text-muted-foreground text-lg">
                <p>
                    <b>MEng in Computer Engineering</b>, University of Alberta
                </p>
                <p>2018 - 2021</p>
            </div>
            <div class="flex justify-between text-muted-foreground text-lg">
                <p>
                    <b>BEng in Electrical and Electronics Engineering</b>,
                    University of Nottingham
                </p>
                <p>2015 - 2018</p>
            </div>
        </div>
        <h3
            class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Work Experience
        </h3>
        <Accordion.Root class="w-full">
            <Accordion.Item value="colab">
                <Accordion.Trigger>
                    <div
                        class="flex w-full items-center justify-between text-left"
                    >
                        <div>
                            <p class="text-lg font-semibold">
                                Senior ML Engineer
                            </p>
                            <p class="text-sm text-muted-foreground">
                                Colab Software
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-muted-foreground">
                                March 2025 - Present
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Toronto, ON, CA
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-2 py-4">
                        <ul
                            class="list-disc space-y-1 pl-6 text-muted-foreground"
                        >
                            <li>
                                Worked with agentic workflows using <b
                                    >Pydantic AI</b
                                >.
                            </li>
                            <li>
                                Implemented vector database solutions for
                                similarity search.
                            </li>
                            <li>
                                Developed 3D/2D models similarity and review
                                systems.
                            </li>
                        </ul>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="marz">
                <Accordion.Trigger>
                    <div
                        class="flex w-full items-center justify-between text-left"
                    >
                        <div>
                            <p class="text-lg font-semibold">ML Engineer</p>
                            <p class="text-sm text-muted-foreground">
                                Monsters, Aliens, Robots and Zombies
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-muted-foreground">
                                May 2022 - March 2025
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Toronto, ON, CA
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-2 py-4">
                        <ul
                            class="list-disc space-y-1 pl-6 text-muted-foreground"
                        >
                            <li>
                                Profiled & Optimized code blocks using <b
                                    >Rust</b
                                > achieving 40x speedup and memory optimizations.
                            </li>
                            <li>
                                Implemented <b>Argo workflows</b> for
                                <b>GenAI</b> pipelines, improving the feedback loop
                                and adding more revenue streams.
                            </li>
                            <li>
                                Contributed to core <b>ML</b> code with
                                <b>PyTorch</b>
                                and <b>Pandas</b>.
                            </li>
                            <li>
                                Supported the launch of the first product,
                                increasing artist efficiency by 90%.
                            </li>
                            <li>
                                Compile & analyze <b>PyTorch</b> and
                                <b>Tensorflow</b>
                                models for optimized inference on <b>Triton</b>.
                            </li>
                            <li>
                                Increased production facing the coverage of the
                                code test from 40% to 85%+ using <b>Pytest</b>.
                            </li>
                            <li>
                                Developed GPU and non-GPU tests; created
                                company-wide composite <b>GitHub Actions</b>.
                            </li>
                            <li>
                                Managed dual <b>Kubernetes</b> and
                                <b>Docker Compose</b>
                                environments, on-prem and in the cloud
                                <b>(AWS, Azure, GCP)</b>.
                            </li>
                            <li>
                                Creating ML related services in our <b
                                    >FastAPI/PostgreSQL</b
                                >
                                backend, I have also helped develop the backend the
                                business logic using <b>Flask</b>.
                            </li>
                            <li>
                                <b>Tech stack:</b> Argo workflows, FastAPI, PyTorch,
                                MongoDB, Postgres, Triton, Kubernetes, Airflow, AWS,
                                GCP, Azure, Pandas, Django, Docker, Docker compose,
                                Github Actions, Tensorflow, Helm, FFMPEG, Rust
                            </li>
                        </ul>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="opus">
                <Accordion.Trigger>
                    <div
                        class="flex w-full items-center justify-between text-left"
                    >
                        <div>
                            <p class="text-lg font-semibold">
                                Software Developer
                            </p>
                            <p class="text-sm text-muted-foreground">
                                Opus Energy Consultants
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-muted-foreground">
                                June 2020 - May 2022
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Calgary, AB, CA
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-2 py-4">
                        <ul
                            class="list-disc space-y-1 pl-6 text-muted-foreground"
                        >
                            <li>
                                Trained and tested audio/video <b>ViT</b> based
                                classification model with ≈ 96% accuracy using
                                <b>PyTorch</b>, optimized using <b>TensorRT</b>
                                for inference and running a <b>docker</b>
                                container on a <b>Jetson Nano</b> board.
                            </li>
                            <li>
                                Deploying <b>MongoDB</b> server and
                                <b>RESTful API</b> to allow seamless user control
                                on the deployed hardware.
                            </li>
                        </ul>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="software-dev-2019">
                <Accordion.Trigger>
                    <div
                        class="flex w-full items-center justify-between text-left"
                    >
                        <div>
                            <p class="text-lg font-semibold">
                                Software Developer
                            </p>
                            <p class="text-sm text-muted-foreground">
                                PinterEC Technology Inc.
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-muted-foreground">
                                September 2019 - September 2020
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-2 py-4">
                        <ul
                            class="list-disc space-y-1 pl-6 text-muted-foreground"
                        >
                            <li>
                                Managing the hardware/software of a 360
                                synchronized video and audio capturing device
                                with a latency ≤ 10ms.
                            </li>
                        </ul>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="elmlab">
                <Accordion.Trigger>
                    <div
                        class="flex w-full items-center justify-between text-left"
                    >
                        <div>
                            <p class="text-lg font-semibold">
                                Electronics and Software Engineer
                            </p>
                            <p class="text-sm text-muted-foreground">
                                ELMLAB Sdn Bhd
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-muted-foreground">
                                September 2017 - December 2017
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Semenyih, MY
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-2 py-4">
                        <ul
                            class="list-disc space-y-1 pl-6 text-muted-foreground"
                        >
                            <li>
                                PID controller for autonomous car braking
                                system.
                            </li>
                            <li>
                                Working with LoRa module to create low power
                                people counter.
                            </li>
                        </ul>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
        <h3
            class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Publications
        </h3>
        <div class="space-y-4">
            <div class="text-muted-foreground text-lg">
                <p>
                    <a
                        href="https://online-journals.org/index.php/i-jim/article/view/13397"
                        target="_blank"
                        rel="noreferrer"
                        class="text-primary font-medium underline underline-offset-4"
                    >
                        International Journal of Interactive Mobile Technologies
                    </a>
                </p>
            </div>
        </div>
        <h3
            class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
        >
            Other
        </h3>
        <div class="space-y-4">
            <div class="text-muted-foreground text-lg">
                <ul class="list-disc space-y-1 pl-6">
                    <li>
                        Navigator App-To-Paper Challenge (2nd Runner Up,
                        Worldwide)
                    </li>
                    <li>
                        IEEEXTREME 11.0 (3rd place in Malaysia and top 15%
                        worldwide, Worldwide)
                    </li>
                    <li>
                        Enginaire Competition (1st runner up, University of
                        Nottingham)
                    </li>
                </ul>
            </div>
        </div>
        <div class="space-y-4">
            <div class="text-muted-foreground text-lg">
                <p><b>Certifications:</b></p>
                <ul class="list-disc space-y-1 pl-6">
                    <li>Advanced PADI Open water diver</li>
                    <li>AutoCad Essentials</li>
                    <li>Open water PADI diver</li>
                </ul>
            </div>
        </div>
        <slot />
    </div>
</section>
