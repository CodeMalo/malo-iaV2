/* =========================================================================
   malo_ia · datos del archivo
   -------------------------------------------------------------------------
   Todo el contenido del sitio vive aqui. Para agregar algo nuevo no toques
   el diseno: edita este archivo.

   - Un TEMA es una tarjeta del indice. Agrega un objeto a `temas`.
   - Una ENTRADA es una fila dentro de un tema (un video, un link, un doc,
     una nota). Agregalas al arreglo `entradas` del tema.

   Campos de un tema:
     slug        id unico para la URL (sin espacios, minusculas)
     titulo      nombre del tema
     resumen     una linea, se ve en la tarjeta del indice
     descripcion parrafo(s) que se ven al abrir el tema
     tags        lista de etiquetas
     actualizado fecha ISO "AAAA-MM-DD"
     entradas    lista de entradas

   Campos OPCIONALES de blog (pagina de detalle con estilo):
     publicar    fecha ISO; si es FUTURA, el tema se oculta del sitio hasta ese dia
     portada     ruta de imagen hero del blog (ej. "assets/img/...jpg")
     repos       [{ label, url }]  botones a repos de GitHub
     recursos    [{ label, url }]  botones a links externos
     slider      [{ tipo:"contexto"|"dolor"|"beneficio", titulo, texto }]
     cuerpo      [{ h, p } | { img, cap }]  cuerpo del blog (titulos, parrafos, imagenes)
     imagenes    [{ src, cap }]  galeria de imagenes

   Campos de una entrada:
     tipo    "video" | "enlace" | "doc" | "nota"
     titulo  nombre de la entrada
     fuente  de donde salio (autor, canal, dominio)
     fecha   ISO "AAAA-MM-DD"
     url     a donde lleva (para "enlace" y "doc")
     archivo ruta local (para "video", ej. "media/voice-agent.mp4")
     nota    texto (para "nota", o descripcion corta de cualquier entrada)
     nuevo   true para marcarla como reciente (opcional)
   ========================================================================= */

window.MALO = {
  meta: {
    nombre: "malo_ia",
    tagline: "The vault",
    manifiesto:
      "A living archive of what I find and learn about artificial intelligence. No noise: docs, videos and links, sorted by topic, so I can come back when I need them.",
    autor: "malo_ia",
    actualizado: "2026-10-19"
  },

  temas: [
    {
      slug: "agentes-de-voz",
      titulo: "Voice agents",
      resumen: "Building an assistant that listens and answers in real time.",
      descripcion:
        "How a talking agent is put together: audio capture, transcription, the model that decides, and the voice coming back. What got me from a demo to a first prototype that actually answers.",
      tags: ["agents", "voice", "real time"],
      actualizado: "2026-10-18",
      // --- blog enriquecido (opcional; esto es lo que se ve en la pagina del tema) ---
      publicar: "2026-10-18",
      portada: "assets/img/poster-voice-agent.jpg",
      repos: [
        { label: "voice-agent", url: "https://github.com/malo-ia/voice-agent" } // PLACEHOLDER: reemplaza por tu repo real
      ],
      recursos: [
        { label: "ElevenLabs", url: "https://elevenlabs.io/" }
      ],
      slider: [
        { tipo: "contexto",  titulo: "The context",  texto: "People now expect to talk to an app and get an answer back. Building that for real (listen, understand, reply out loud, live) is still intimidating." },
        { tipo: "dolor",     titulo: "The pain",      texto: "Demos sound magical and then fall apart in real use: half a second too slow and the conversation feels like a form. Latency kills the illusion." },
        { tipo: "beneficio", titulo: "The payoff",    texto: "With the right stack (capture, transcription, model, voice) and an ear on the milliseconds, you go from a demo to a prototype that actually answers." }
      ],
      cuerpo: [
        { h: "How it fits together", p: "The agent is a loop: audio capture, streaming transcription, the model deciding what to say, and speech synthesis on the way back. Every link adds latency, and the sum is the experience." },
        { img: "assets/img/poster-voice-agent.jpg", cap: "The prototype answering live." },
        { p: "No single component is the star. What matters is that none of them stalls. Stream end to end instead of waiting for each step to finish." },
        { h: "The number that matters", p: "Under ~700 ms a conversation feels human; above it, it feels like paperwork. The whole design bends around that number." }
      ],
      imagenes: [
        { src: "assets/img/poster-voice-agent.jpg", cap: "Voice agent, live." },
        { src: "assets/img/poster-media.jpg",       cap: "The whole vault flow." }
      ],
      entradas: [
        {
          tipo: "video",
          titulo: "Your own voice agent, from scratch",
          fuente: "malo_ia",
          fecha: "2026-10-17",
          archivo: "media/voice-agent.mp4",
          nota: "The full walkthrough: from the idea to an agent that answers out loud.",
          nuevo: true
        },
        {
          tipo: "enlace",
          titulo: "ElevenLabs — speech synthesis",
          fuente: "elevenlabs.io",
          fecha: "2026-10-10",
          url: "https://elevenlabs.io/",
          nota: "The output voice. High quality, low latency."
        },
        {
          tipo: "nota",
          titulo: "Latency is the experience",
          fuente: "malo_ia",
          fecha: "2026-10-18",
          nota: "Under ~700 ms the conversation feels human; above it, it feels like a form. The whole design revolves around that number."
        }
      ]
    },

    {
      slug: "diseno-con-ia",
      titulo: "Interface design",
      resumen: "Making software feel good, not just work.",
      descripcion:
        "The invisible details that separate a good interface from one that is a pleasure to use: animation with a purpose, custom easing curves, press states, timings under 300 ms. Emil Kowalski's philosophy applied to what I build.",
      tags: ["design", "UI", "motion"],
      actualizado: "2026-10-17",
      entradas: [
        {
          tipo: "video",
          titulo: "Improve the design of your website",
          fuente: "malo_ia",
          fecha: "2026-10-17",
          archivo: "media/email-kowalski.mp4",
          nota: "Going from a site that is fine to one with character.",
          nuevo: true
        },
        {
          tipo: "enlace",
          titulo: "emilkowal.ski — design engineering essays",
          fuente: "emilkowal.ski",
          fecha: "2026-09-01",
          url: "https://emilkowal.ski/",
          nota: "The source. Why taste can be trained."
        },
        {
          tipo: "enlace",
          titulo: "animations.dev — animation course",
          fuente: "animations.dev",
          fecha: "2026-09-01",
          url: "https://animations.dev/"
        },
        {
          tipo: "nota",
          titulo: "ease-out for things that enter",
          fuente: "malo_ia",
          fecha: "2026-10-17",
          nota: "ease-in feels slow even when it lasts the same, because it starts late exactly when the eye is looking. For anything appearing, use ease-out with your own curve."
        }
      ]
    },

    {
      slug: "aprender-mirando",
      titulo: "Learning by watching",
      resumen: "Letting the AI watch a video and pull out what is useful.",
      descripcion:
        "No more transcribing by hand: you hand it a video and it understands what happens. How I turn hours of reels and demos into notes, steps and links right here.",
      tags: ["video", "research", "workflow"],
      actualizado: "2026-10-17",
      entradas: [
        {
          tipo: "video",
          titulo: "AI can watch videos and learn from them",
          fuente: "malo_ia",
          fecha: "2026-10-17",
          archivo: "media/watch-videos.mp4",
          nota: "The trick that makes this vault possible.",
          nuevo: true
        },
        {
          tipo: "nota",
          titulo: "From reel to card",
          fuente: "malo_ia",
          fecha: "2026-10-17",
          nota: "The flow: watch, summarize in 3 bullets, save the link and the date. If it does not fit on a card, I have not understood it yet."
        }
      ]
    },

    {
      slug: "la-boveda",
      titulo: "The vault",
      resumen: "What malo_ia is and why I keep everything here.",
      descripcion:
        "Everything I need about AI in one place, sorted and at hand. This section explains the rule: what gets in, what does not, and how the archive is built.",
      tags: ["meta", "archive"],
      actualizado: "2026-10-11",
      entradas: [
        {
          tipo: "video",
          titulo: "It is all in the vault",
          fuente: "malo_ia",
          fecha: "2026-10-11",
          archivo: "media/media.mp4",
          nota: "The idea behind the project."
        },
        {
          tipo: "nota",
          titulo: "The rule",
          fuente: "malo_ia",
          fecha: "2026-10-11",
          nota: "What gets in is what I plan to use again. Each thing with its source and date, so I can tell if it aged. Fewer, better entries than a graveyard of open tabs."
        }
      ]
    },

    {
      slug: "prompting",
      titulo: "Prompting",
      resumen: "Asking well is half the result.",
      descripcion:
        "Techniques I keep repeating: give context and examples, separate instructions from data, ask for the output format, and let the model think before answering when the problem calls for it.",
      tags: ["prompting", "claude", "technique"],
      actualizado: "2026-10-05",
      entradas: [
        {
          tipo: "enlace",
          titulo: "Anthropic's prompting guide",
          fuente: "docs.anthropic.com",
          fecha: "2026-09-20",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"
        },
        {
          tipo: "nota",
          titulo: "Instructions and data, kept apart",
          fuente: "malo_ia",
          fecha: "2026-10-05",
          nota: "What I send are instructions; what arrives from outside (a page, an email) is data, not orders. Mixing them is how a prompt injection gets in."
        }
      ]
    },

    {
      slug: "modelos-locales",
      titulo: "Local models",
      resumen: "Running a model on your machine, no API, no bill.",
      descripcion:
        "For when I do not want to spend the API or send data out: an open model running locally. I use it for paper trading and for trying ideas at zero cost per token.",
      tags: ["local", "ollama", "open source"],
      actualizado: "2026-10-01",
      entradas: [
        {
          tipo: "enlace",
          titulo: "Ollama — local models in one command",
          fuente: "ollama.com",
          fecha: "2026-09-15",
          url: "https://ollama.com/"
        },
        {
          tipo: "nota",
          titulo: "qwen2.5:7b for day to day",
          fuente: "malo_ia",
          fecha: "2026-10-01",
          nota: "A local 7B is enough for paper trading and prototyping without touching the key. The upside is not that it is the best model, it is that it is free and endless."
        }
      ]
    },

    {
      slug: "evals-y-medicion",
      titulo: "Evals and measuring",
      resumen: "If you do not measure it, you do not know if your AI app works.",
      descripcion:
        "The number one mistake when building with AI is not measuring. How I build a set of cases, define what a good answer is, and compare versions before trusting a change.",
      tags: ["evals", "quality", "method"],
      actualizado: "2026-09-28",
      entradas: [
        {
          tipo: "enlace",
          titulo: "Building evals with Claude",
          fuente: "docs.anthropic.com",
          fecha: "2026-09-10",
          url: "https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests"
        },
        {
          tipo: "nota",
          titulo: "The case first, the prompt after",
          fuente: "malo_ia",
          fecha: "2026-09-28",
          nota: "Write 10 cases with their expected answer before touching the prompt. After that, every change defends itself against those 10, not against my gut feeling of the moment."
        }
      ]
    },

    {
      slug: "agentes-y-automatizacion",
      titulo: "Agents and automation",
      resumen: "Let an agent do the repetitive work.",
      descripcion:
        "From a single prompt to a system that does steps on its own: sub-agents, tools and tasks that run while I am away. What works and what still breaks.",
      tags: ["agents", "automation", "claude code"],
      actualizado: "2026-10-14",
      entradas: [
        {
          tipo: "enlace",
          titulo: "Claude Code",
          fuente: "claude.com",
          fecha: "2026-10-01",
          url: "https://claude.com/claude-code"
        },
        {
          tipo: "nota",
          titulo: "One agent per task, not one agent for everything",
          fuente: "malo_ia",
          fecha: "2026-10-14",
          nota: "The ones that work best have one small, clear job. The agent that does everything is the one that breaks the most."
        }
      ]
    }
  ]
};
