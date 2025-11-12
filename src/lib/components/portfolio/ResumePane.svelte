<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { toast } from "svelte-sonner";
    import * as Accordion from "$lib/components/ui/accordion";
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
        try {
            toast("Generating PDF...");
            
            const response = await fetch("/api/export-resume", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to generate PDF");
            }

            // Get the PDF blob
            const blob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Essam_Gouda_Resume.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast("PDF exported successfully!");
        } catch (error) {
            console.error("PDF export error:", error);
            toast("Failed to export PDF. Please try again.");
        }
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
                                St. John, NL, CA
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-4 py-4">
                        <ul
                            class="list-disc space-y-2 pl-6 text-muted-foreground"
                        >
                            <li>
                                Built agentic workflows using Pydantic AI for
                                automated tasks
                            </li>
                            <li>
                                Designed evaluation pipelines for 3D/2D model
                                similarity and retrieval using OpenSearch vector
                                database
                            </li>
                        </ul>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">Pydantic AI</Badge>
                            <Badge variant="secondary">OpenSearch</Badge>
                            <Badge variant="secondary">Vector DB</Badge>
                        </div>
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
                    <div class="space-y-4 py-4">
                        <ul
                            class="list-disc space-y-2 pl-6 text-muted-foreground"
                        >
                            <li>
                                Achieved 40x performance improvement through
                                Rust code optimization
                            </li>
                            <li>
                                Built Argo workflows for GenAI pipelines,
                                accelerating feedback loops and enabling new
                                revenue streams
                            </li>
                            <li>
                                Developed core ML features with PyTorch and
                                Pandas
                            </li>
                            <li>
                                Launched first product, boosting artist
                                efficiency by 90%
                            </li>
                            <li>
                                Optimized PyTorch and TensorFlow models for
                                Triton inference
                            </li>
                            <li>
                                Increased test coverage from 40% to 85%+ with
                                Pytest
                            </li>
                            <li>
                                Created GPU/non-GPU testing framework and GitHub
                                Actions pipelines
                            </li>
                            <li>
                                Managed Kubernetes and Docker Compose
                                environments across AWS, Azure, and GCP
                            </li>
                            <li>
                                Developed ML services using FastAPI, Flask,
                                PostgreSQL, and MongoDB
                            </li>
                        </ul>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">Rust</Badge>
                            <Badge variant="secondary">Argo Workflows</Badge>
                            <Badge variant="secondary">PyTorch</Badge>
                            <Badge variant="secondary">TensorFlow</Badge>
                            <Badge variant="secondary">Triton</Badge>
                            <Badge variant="secondary">FastAPI</Badge>
                            <Badge variant="secondary">Kubernetes</Badge>
                            <Badge variant="secondary">Docker</Badge>
                            <Badge variant="secondary">AWS</Badge>
                            <Badge variant="secondary">Azure</Badge>
                            <Badge variant="secondary">GCP</Badge>
                            <Badge variant="secondary">Pytest</Badge>
                            <Badge variant="secondary">GitHub Actions</Badge>
                            <Badge variant="secondary">PostgreSQL</Badge>
                            <Badge variant="secondary">MongoDB</Badge>
                            <Badge variant="secondary">Pandas</Badge>
                        </div>
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
                    <div class="space-y-4 py-4">
                        <ul
                            class="list-disc space-y-2 pl-6 text-muted-foreground"
                        >
                            <li>
                                Developed ViT-based audio/video classification
                                model (96% accuracy) with PyTorch
                            </li>
                            <li>
                                Optimized inference with TensorRT and deployed
                                on Jetson Nano using Docker
                            </li>
                            <li>
                                Built MongoDB server with RESTful API for
                                hardware control
                            </li>
                        </ul>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">ViT</Badge>
                            <Badge variant="secondary">PyTorch</Badge>
                            <Badge variant="secondary">TensorRT</Badge>
                            <Badge variant="secondary">Docker</Badge>
                            <Badge variant="secondary">Jetson Nano</Badge>
                            <Badge variant="secondary">MongoDB</Badge>
                            <Badge variant="secondary">RESTful API</Badge>
                        </div>
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
                                Sept 2019 - Sept 2020
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Calgary, AB, CA
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-4 py-4">
                        <ul
                            class="list-disc space-y-2 pl-6 text-muted-foreground"
                        >
                            <li>
                                Managed hardware/software for 360° synchronized
                                video/audio capture system with ≤10ms latency
                            </li>
                        </ul>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">Embedded Systems</Badge>
                            <Badge variant="secondary">Real-time Systems</Badge>
                        </div>
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
                                Sept 2017 - Dec 2017
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Semenyih, MY
                            </p>
                        </div>
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="space-y-4 py-4">
                        <ul
                            class="list-disc space-y-2 pl-6 text-muted-foreground"
                        >
                            <li>
                                Designed PID controller for autonomous car
                                braking system
                            </li>
                            <li>
                                Developed low-power people counter using LoRa
                                modules
                            </li>
                        </ul>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">PID Control</Badge>
                            <Badge variant="secondary">LoRa</Badge>
                            <Badge variant="secondary">Embedded Systems</Badge>
                        </div>
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
                        BIM-VR Framework for Building Information Modelling in
                        Engineering Education
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
