/*
  EDIT THIS FILE FIRST.
  Most text shown across the website lives here. Keep quotation marks and commas intact.
*/

window.NEUROFOLIO_CONTENT = {
  profile: {
    name: "Aref Pariz, Ph.D.",
    shortName: "Aref Pariz",
    initials: "AP",
    eyebrow: "Systems & Computational Neuroscience · Neuromodulation · Concurrent fMRI–tES",
    headline: "I investigate how neuromodulation technologies modulate brain function and communication dynamics.",
    introduction:
      "I am a computational and theoretical neuroscientist trained in physics. My work connects neural-network models, TMS-EEG, electric-field simulations, and clinical questions to make non-invasive brain stimulation more precise and interpretable.",
    currentRole: "Assistant Instructor · Department of Psychiatry · UT Southwestern Medical Center",
    location: "Dallas, Texas, USA",
    availability: "Collaborations in concurrent fMRI–tES, closed-loop neuromodulation, computational psychiatry, and systems neuroscience",
    links: {
      scholar: "https://scholar.google.com/citations?user=K3VWD8IAAAAJ",
      orcid: "https://orcid.org/0000-0003-1601-2826",
      github: "https://github.com/arefpz",
      faculty: "https://profiles.utsouthwestern.edu/profile/246057/aref-pariz.html",
      cv: "./assets/files/Aref_Pariz_CV.pdf",      
    }
  },

  currentFocus: {
    label: "Current research signal",
    title: "Precision stimulation for clinically relevant brain networks",
    text:
      "My current work focuses on individualized tES and tACS, with an emphasis on computational psychiatry, addictive and related conditions, and stimulation designs constrained by neuroimaging and electrophysiology.",
    tags: [
      "Concurrent fMRI–tES",
      "Closed-loop neuromodulation",
      "Systems neuroscience",
      "Computational neuroscience",
      "Computational psychiatry"
    ]
  },

  researchThemes: [
    {
      number: "01",
      title: "Dynamic routing of information",
      text: "I study how firing rate, oscillatory phase, frequency mismatch, and communication delay determine which brain region becomes an effective sender, receiver, or relay.",
      tags: ["Effective connectivity", "Information transfer", "Neural oscillations"],
      /*  visual: { kind: "network", label: "Delay, phase, and directed flow" } , */
      papers: ["delays-detuning-information-flow", "relay-population-information-transmission", "high-frequency-neurons-effective-connectivity"]
    },
    {
      number: "02",
      title: "Precision non-invasive brain stimulation",
      text: "I use computational and electric-field models to examine how anatomy, neuronal variability, stimulation timing, and synaptic plasticity shape the effects of non-invasive brain stimulation.",
      tags: ["tACS / tES", "Electric-field modeling", "Synaptic plasticity"],
      /*  visual: { kind: "field", label: "Anatomy, field, and plasticity" } , */
      papers: ["morphological-variability-electric-fields", "selective-control-synaptic-plasticity-tacs", "amplifying-post-stimulation-oscillations"]
    },
    {
      number: "03",
      title: "Heterogeneity and resilience",
      text: "Rather than averaging away biological variability, I examine when differences among neurons, cortical layers, and individuals create control opportunities or stabilize network dynamics.",
      tags: ["Neural diversity", "Resilience", "Individual variability"],
      /*  visual: { kind: "scores", label: "Diversity reshapes response" } , */
      papers: ["diversity-resilience-neural-dynamics", "morphological-variability-electric-fields", "selective-control-synaptic-plasticity-tacs"]
    },
    {
      number: "04",
      title: "Computational psychiatry across scales",
      text: "The long-term goal is to connect cell- and circuit-level mechanisms with EEG, fMRI, clinical outcomes, AI, foundation models, and subject-specific stimulation protocols.",
      tags: ["Computational psychiatry", "AI", "Foundation models"],
      /*  visual: { kind: "ai", label: "From neuroimaging to virtual brains" } , */
      papers: ["ai-precision-brain-stimulation", "personalized-brain-stimulation-oscillations", "nestapp-tms-eeg-preprocessing"]
    }
  ],

  researchProgram: [
    {
      title: "Model the perturbation",
      text: "Build mechanistic models of how electric and magnetic stimulation interact with neurons, synapses, cortical layers, and large-scale networks."
    },
    {
      title: "Measure the brain state",
      text: "Use EEG, TMS-EEG, fMRI, and network-level markers to characterize the state in which stimulation is delivered and the state it produces."
    },
    {
      title: "Preserve individual variability",
      text: "Treat anatomy, oscillatory frequency, excitability, and connectivity differences as parameters for personalization rather than unexplained noise."
    },
    {
      title: "Translate predictions into protocols",
      text: "Design stimulation strategies with explicit, falsifiable targets: a field distribution, a connectivity change, an oscillatory state, or a clinical response."
    }
  ],

  clinicalProtocols: [
    {
      status: "IRB submission in preparation",
      title: "Clinical neuromodulation protocol",
      text: "Study details and the ClinicalTrials.gov record will be added after approvals and public registration.",
      url: ""
    },
    {
      status: "Registration link forthcoming",
      title: "Additional clinical study",
      text: "This card is reserved for a future protocol summary, eligibility overview, and registry link.",
      url: ""
    }
  ],

  timeline: [
    {
      period: "2026–present",
      role: "Assistant Instructor",
      place: "Department of Psychiatry, UT Southwestern Medical Center",
      focus: "Individualized tES/tACS and related stimulation methods for addictive and related conditions."
    },
    {
      period: "2023–2026",
      role: "Postdoctoral Researcher",
      place: "Institute of Mental Health Research at The Royal & University of Ottawa",
      focus: "TMS, theta-burst stimulation, TMS-EEG, brain disorders, and effective connectivity."
    },
    {
      period: "2021–2023",
      role: "Postdoctoral Researcher",
      place: "Department of Biology, University of Ottawa",
      focus: "Brain stimulation, synaptic modification, and neuronal population dynamics."
    },
    {
      period: "2019–2020",
      role: "Postdoctoral Researcher",
      place: "Institute for Advanced Studies in Basic Sciences",
      focus: "Chemometric data-analysis methods applied to neuroscience."
    },
    {
      period: "2018–2019",
      role: "Visiting Researcher",
      place: "IFISC (UIB-CSIC), Palma de Mallorca",
      focus: "Communication delays, oscillations, and information transfer between neural populations."
    },
    {
      period: "2012–2018",
      role: "Ph.D. in Physics",
      place: "Institute for Advanced Studies in Basic Sciences",
      focus: "Controlling information transfer through phase manipulation of neuronal population activity."
    }
  ],

  publications: [
    {
      slug: "ai-precision-brain-stimulation",
      year: "2026",
      type: "Preprint",
      title: "Artificial Intelligence for Precision Brain Stimulation: From Neuroimaging to Foundation Models and Virtual Brains",
      venue: "PsyArXiv",
      citation: "PsyArXiv preprint (2026).",
      authors: "M. Hashemi, W. Shi, G. Soleimani, I. Villanueva-Miranda, A. Pariz, S. Anteraper, J. Jin, S. L. Mansour, D. Benette Marques, M. Mirjalili, A. Opitz, A. Juliano, P. Triebkorn, H. Wang, C. Yang, T. Rajji, A. R. Brunoni, V. Jirsa, G. Xiao, and H. Ekhtiari",
      simpleSummary:
        "This perspective examines how AI, neuroimaging, foundation models, and virtual-brain approaches could support more individualized and testable brain-stimulation strategies.",
      question: "How can AI connect multimodal brain data with personalized stimulation planning and prediction?",
      approach:
        "The article organizes emerging approaches across neuroimaging, machine learning, foundation models, and virtual-brain modeling, while considering how they may contribute to precision brain stimulation.",
      result:
        "The proposed framework treats AI as a bridge between heterogeneous brain measurements, mechanistic models, and clinically meaningful predictions rather than as a stand-alone black box.",
      contributions: [
        "Maps the roles that neuroimaging and AI can play across the stimulation workflow.",
        "Places foundation models and virtual brains within a precision-neuromodulation framework.",
        "Emphasizes validation, interpretability, and clinical translation."
      ],
      methods: ["Artificial intelligence", "Foundation models", "Neuroimaging", "Virtual brains"],
      links: {
        doi: "https://doi.org/10.31234/osf.io/qnjd6_v1"
      },
      visual: { kind: "ai", label: "Neuroimaging → AI → stimulation" }
    },
    {
      slug: "nestapp-tms-eeg-preprocessing",
      year: "2026",
      type: "Preprint",
      title: "NESTApp: A GUI-Based MATLAB Application for Simplified TMS-EEG Preprocessing with EEGLAB",
      venue: "SSRN",
      citation: "SSRN preprint (2026).",
      authors: "A. Pariz, W. Dunne, J. Lefebvre, and S. Tremblay",
      simpleSummary:
        "NESTApp lets an experienced researcher design and validate a modular EEG or TMS-EEG preprocessing pipeline that other users can run without writing code.",
      question: "Can flexible TMS-EEG preprocessing be made easier to design, share, execute, and audit?",
      approach:
        "A MATLAB graphical interface was built around EEGLAB and compatible tools so users can order processing modules, configure parameters, save reusable templates, run batches, and generate quality-control reports.",
      result:
        "The application separates expert pipeline design from routine execution while preserving configurable processing steps, safeguards, and reviewable reports.",
      contributions: [
        "Provides a modular graphical workflow rather than a fixed preprocessing sequence.",
        "Supports reusable pipeline templates, batch processing, and automatic reports.",
        "Reduces the amount of coding needed to reproduce an expert-designed workflow."
      ],
      methods: ["TMS-EEG", "EEGLAB", "MATLAB App Designer", "Signal preprocessing"],
      links: {
        manuscript: "https://ssrn.com/abstract=6204470",
        code: "https://github.com/arefpz/NESTAPP"
      },
      visual: { kind: "pipeline", label: "Modular preprocessing pipeline" }
    },
    {
      slug: "personalized-brain-stimulation-oscillations",
      year: "2025",
      type: "Preprint",
      title: "Personalized Brain Stimulation Based on Brain Oscillations: A Systematic Review of MEG- and EEG-Informed tACS Trials",
      venue: "PsyArXiv",
      citation: "PsyArXiv preprint (2025).",
      authors: "S. Sharifzadeh, A. F. Jouzdani, A. Souki, I. Alekseichuk, A. R. Brunoni, D. B. Marques, M. Ebrahimi, P. Ghobadi-Azbari, A. Pariz, G. Soleimani, F. Yavari, R. Khosrowabadi, I. R. Violante, and H. Ekhtiari",
      simpleSummary:
        "Across 69 publications and 131 experiments, personalized tACS most often used EEG or MEG to choose stimulation frequency, while timing- and montage-based personalization were much less common.",
      question: "How have EEG and MEG been used to personalize the frequency, timing, or montage of tACS?",
      approach:
        "A PRISMA-guided systematic review identified M/EEG-informed individualized tACS studies published through January 2024 and summarized their personalization choices and outcomes.",
      result:
        "Frequency-based personalization dominated the literature, particularly in the alpha band; the review identifies a need for stronger active controls and broader testing of timing and montage personalization.",
      contributions: [
        "Characterizes 131 personalized tACS experiments across 69 publications.",
        "Separates frequency-, timing-, and montage-based individualization strategies.",
        "Provides a roadmap for more rigorous personalized tACS trials."
      ],
      methods: ["Systematic review", "EEG / MEG", "Personalized tACS", "PRISMA"],
      links: {
        doi: "https://doi.org/10.31234/osf.io/q8x6v_v1"
      },
      visual: { kind: "spectra", label: "Frequency-informed personalization" }
    },
    {
      slug: "surfing-brain-waves-commentary",
      year: "2025",
      type: "Commentary",
      title: "Surfing brain waves without sinking: A commentary on “Entrainment by transcranial alternating current stimulation: Insight from models of cortical oscillations and dynamical systems theory”",
      venue: "Physics of Life Reviews, 55, 55–57",
      citation: "Physics of Life Reviews 55, 55–57 (2025).",
      authors: "J. Lefebvre, A. Pariz, J.-P. Thivierge, and A. Hutt",
      simpleSummary:
        "A short perspective on how dynamical-systems models can clarify when tACS may entrain cortical rhythms—and why resonance should not be interpreted as a simple one-frequency effect.",
      question: "What can models of cortical oscillations realistically tell us about tACS entrainment?",
      approach:
        "The commentary evaluates a review of tACS entrainment through the language of nonlinear dynamics, cortical oscillations, resonance, and model interpretation.",
      result:
        "Its central message is methodological: models are most useful when their assumptions, operating regimes, and measurable predictions remain explicit.",
      contributions: [
        "Places tACS entrainment in a broader dynamical-systems framework.",
        "Emphasizes careful interpretation of resonance and synchronization.",
        "Connects theoretical models with experimentally testable questions."
      ],
      methods: ["Commentary", "Dynamical systems", "tACS entrainment"],
      links: {
        doi: "https://doi.org/10.1016/j.plrev.2025.08.009"
      },
      visual: { kind: "spectra", label: "Entrainment landscape" }
    },
    {
      slug: "morphological-variability-electric-fields",
      year: "2025",
      type: "Journal article",
      title: "Morphological variability may limit single-cell specificity to electric field stimulation",
      venue: "Frontiers in Synaptic Neuroscience, 17, 1621352",
      citation: "Frontiers in Synaptic Neuroscience 17, 1621352 (2025).",
      authors: "D. J. Trotter, A. Pariz, A. Hutt, and J. Lefebvre",
      simpleSummary:
        "Different neuron shapes respond differently to an electric field, but the responses overlap too much to reliably target one cell type using morphology alone.",
      question: "Can cell shape and cortical layer predict which individual neurons respond to a weak electric field?",
      approach:
        "Biophysical models based on reconstructed pyramidal and parvalbumin neurons were grouped by layer and morphology, then exposed to uniform electric fields while somatic, axonal, and dendritic polarization was measured.",
      result:
        "The fields modulated the cells, but no measured physical feature produced statistically reliable layer- or subtype-specific targeting. Morphological variability blurred the apparent specificity.",
      contributions: [
        "Quantified whole-cell and compartment-level morphology across several cortical cell classes.",
        "Tested whether those features predict electric-field susceptibility.",
        "Established a practical limit on claims of single-cell specificity from morphology alone."
      ],
      methods: ["Biophysical neuron models", "Electric fields", "Morphology", "NIBS"],
      links: {
        doi: "https://doi.org/10.3389/fnsyn.2025.1621352"
      },
      figure: {
        src: "./assets/images/publications/morphology-figure1.webp",
        alt: "Reconstructed pyramidal and parvalbumin neurons from cortical layers 2/3, 4, and 5, with plots comparing vector magnitude, vertical length, volume, and example myelination.",
        caption: "Whole-cell morphology across pyramidal and parvalbumin neuron models from layers 2/3, 4, and 5.",
        credit: "Figure 1 from Trotter et al. (2025), Frontiers in Synaptic Neuroscience. CC BY 4.0.",
        source: "https://doi.org/10.3389/fnsyn.2025.1621352"
      },
      visual: { kind: "field", label: "Morphology × electric field" }
    },
    {
      slug: "amplifying-post-stimulation-oscillations",
      year: "2025",
      type: "Journal article",
      title: "Amplifying post-stimulation oscillatory dynamics by engaging synaptic plasticity with transcranial alternating current stimulation",
      venue: "Frontiers in Network Physiology, 5, 1621283",
      citation: "Frontiers in Network Physiology 5, 1621283 (2025).",
      authors: "J. Lefebvre and A. Pariz",
      simpleSummary:
        "In a model network, tACS can leave stronger rhythms after stimulation ends when differences in neuronal time scales recruit selective synaptic plasticity.",
      question: "Under what conditions can a temporary alternating-current stimulus create a lasting increase in network oscillations?",
      approach:
        "A balanced network of excitatory and inhibitory spiking neurons was given heterogeneous membrane time constants, spike-timing-dependent plasticity, and tACS at different frequencies and amplitudes.",
      result:
        "Post-stimulation amplification emerged when time-scale heterogeneity and selective synaptic plasticity worked together. Randomizing the learned synaptic pattern removed the effect.",
      contributions: [
        "Links stimulation aftereffects to selective, cell-type-dependent synaptic changes.",
        "Shows why neuronal time-scale diversity can matter after stimulation has stopped.",
        "Identifies stimulation frequency, amplitude, and plasticity as interacting control variables."
      ],
      methods: ["Spiking networks", "tACS", "STDP", "Spectral analysis"],
      links: {
        doi: "https://doi.org/10.3389/fnetp.2025.1621283"
      },
      figure: {
        src: "./assets/images/publications/post-stimulation-figure1.webp",
        alt: "Side-by-side pre-stimulation and post-stimulation network diagrams, synaptic matrices, spike rasters, firing-rate distributions, local field potentials, and power spectra.",
        caption: "A model network before and after tACS: persistent changes in synaptic weights accompany stronger post-stimulation oscillations.",
        credit: "Figure 1 from Lefebvre & Pariz (2025), Frontiers in Network Physiology. CC BY 4.0.",
        source: "https://doi.org/10.3389/fnetp.2025.1621283"
      },
      visual: { kind: "plasticity", label: "Post-stimulation dynamics" }
    },
    {
      slug: "diversity-resilience-neural-dynamics",
      year: "2024",
      type: "Journal article",
      title: "Diversity-induced trivialization and resilience of neural dynamics",
      venue: "Chaos, 34(1), 013147",
      citation: "Chaos 34, 013147 (2024).",
      authors: "A. Hutt, D. Trotter, A. Pariz, T. A. Valiante, and J. Lefebvre",
      simpleSummary:
        "Making neurons more different from one another can reduce the number of competing network states and make the collective dynamics harder to destabilize.",
      question: "How can neural circuits remain stable even though their cells are highly diverse?",
      approach:
        "The study analyzed sparse nonlinear neural networks and counted how many stationary states remained as excitability heterogeneity and network parameters changed.",
      result:
        "Excitability diversity quenched excess stationary states and reduced susceptibility to transitions, providing a homeostatic route to network resilience.",
      contributions: [
        "Connects biological heterogeneity with topological trivialization.",
        "Defines resilience through the network's stationary-state landscape.",
        "Shows that diversity can stabilize rather than merely complicate dynamics."
      ],
      methods: ["Nonlinear networks", "Random matrix theory", "Resilience", "Heterogeneity"],
      links: {
        doi: "https://doi.org/10.1063/5.0165773",
        manuscript: "https://inria.hal.science/hal-04162586"
      },
      visual: { kind: "scores", label: "State-space resilience" }
    },
    {
      slug: "selective-control-synaptic-plasticity-tacs",
      year: "2023",
      type: "Journal article",
      title: "Selective control of synaptic plasticity in heterogeneous networks through transcranial alternating current stimulation (tACS)",
      venue: "PLOS Computational Biology, 19(4), e1010736",
      citation: "PLOS Computational Biology 19(4), e1010736 (2023).",
      authors: "A. Pariz, D. Trotter, A. Hutt, and J. Lefebvre",
      simpleSummary:
        "tACS may use natural differences in neuronal time scales to strengthen some synapses and weaken others in a selective, directional way.",
      question: "Can neural heterogeneity be used as a control mechanism rather than treated as an obstacle to stimulation?",
      approach:
        "Spiking-neuron models with spike-timing-dependent plasticity were studied at single-cell, within-layer, and between-layer scales while periodic electric stimulation was applied.",
      result:
        "Mismatch in membrane time constants changed phase and frequency tuning, allowing tACS to preferentially modify specific synaptic directions within and across cortical layers.",
      contributions: [
        "Introduces neuronal time-scale mismatch as a handle for selective plasticity.",
        "Connects cell-level phase relationships to laminar network remodeling.",
        "Provides a mechanistic route toward more targeted tACS protocols."
      ],
      methods: ["Leaky integrate-and-fire", "tACS", "STDP", "Laminar networks"],
      links: {
        doi: "https://doi.org/10.1371/journal.pcbi.1010736",
        code: "https://github.com/arefpz/neuronal_population"
      },
      visual: { kind: "plasticity", label: "Selective plasticity" }
    },
    {
      slug: "relay-population-information-transmission",
      year: "2021",
      type: "Journal article",
      title: "Information transmission in delay-coupled neuronal circuits in the presence of a relay population",
      venue: "Frontiers in Systems Neuroscience, 15, 705371",
      citation: "Frontiers in Systems Neuroscience 15, 705371 (2021).",
      authors: "J. Sánchez-Claros, A. Pariz, A. Valizadeh, S. Canals, and C. R. Mirasso",
      simpleSummary:
        "A relay population—modeled after the thalamus—can keep information moving between cortical populations even when their frequencies and delays do not match perfectly.",
      question: "Can a third neural population stabilize communication between two cortical areas?",
      approach:
        "Three oscillating populations were arranged as a V-shaped or circular circuit, then connection delay, frequency mismatch, and direct cortico-cortical coupling were varied while signal transmission was measured.",
      result:
        "The relay supported robust bottom-up and feedback communication across a wider range of frequency mismatch than direct cortical transmission alone.",
      contributions: [
        "Tests communication through coherence in cortico-thalamo-cortical motifs.",
        "Separates the roles of relay and direct cortical connections.",
        "Shows how delay and detuning create switchable communication modes."
      ],
      methods: ["Hodgkin-Huxley networks", "Delay coupling", "Thalamic relay", "Signal transmission"],
      links: {
        doi: "https://doi.org/10.3389/fnsys.2021.705371"
      },
      figure: {
        src: "./assets/images/publications/relay-circuit-figure1.webp",
        alt: "Three neuronal populations arranged in a triangular circuit, with excitatory and inhibitory neurons inside each population and delayed inter-population connections.",
        caption: "The modeled three-population circuit: cortical populations 1 and 3 communicate through a relay population representing the thalamus.",
        credit: "Figure 1 from Sánchez-Claros et al. (2021), Frontiers in Systems Neuroscience. CC BY 4.0.",
        source: "https://doi.org/10.3389/fnsys.2021.705371"
      },
      visual: { kind: "relay", label: "Relay-mediated communication" }
    },
    {
      slug: "delays-detuning-information-flow",
      year: "2021",
      type: "Journal article",
      title: "Transmission delays and frequency detuning can regulate information flow between brain regions",
      venue: "PLOS Computational Biology, 17(4), e1008129",
      citation: "PLOS Computational Biology 17(4), e1008129 (2021).",
      authors: "A. Pariz, I. Fischer, A. Valizadeh, and C. R. Mirasso",
      simpleSummary:
        "The direction and quality of communication between two oscillating brain regions depend jointly on their frequency difference and the time needed for signals to travel between them.",
      question: "Why can the same anatomical connection support different directions of effective information flow?",
      approach:
        "Numerical simulations and reduced analytical models were used to vary conduction delay and natural-frequency mismatch between coupled neural populations.",
      result:
        "Phase lead alone did not determine the sender. Delay, frequency, and each population's phase-response properties jointly controlled how much information moved and in which direction.",
      contributions: [
        "Makes transmission delay an explicit control variable in communication-through-coherence theory.",
        "Shows that frequency detuning can reverse or balance effective communication.",
        "Links collective phase-response curves to measurable information transfer."
      ],
      methods: ["Oscillatory populations", "Delay systems", "Phase response", "Information theory"],
      links: {
        doi: "https://doi.org/10.1371/journal.pcbi.1008129",
        code: "https://github.com/ITNG/ParizPLOS2021"
      },
      visual: { kind: "delay", label: "Delay × frequency" }
    },
    {
      slug: "high-frequency-neurons-effective-connectivity",
      year: "2018",
      type: "Journal article",
      title: "High frequency neurons determine effective connectivity in neuronal networks",
      venue: "NeuroImage, 166, 349–359",
      citation: "NeuroImage 166, 349–359 (2018).",
      authors: "A. Pariz, Z. G. Esfahani, S. S. Parsi, A. Valizadeh, S. Canals, and C. R. Mirasso",
      simpleSummary:
        "A node that fires faster than the rest can become a functional hub, pushing its activity outward even when the underlying anatomical connections are symmetric.",
      question: "How can a structurally symmetric neural network create directed routes for information?",
      approach:
        "The study combined neuronal-network simulations with information-transfer analysis while changing the firing frequency and network position of selected nodes.",
      result:
        "Higher-frequency units determined the dominant direction of signal propagation, turning firing rate into a tunable mechanism for effective connectivity.",
      contributions: [
        "Distinguishes structural connectivity from dynamically directed effective connectivity.",
        "Shows that a low-degree node can become a functional hub by increasing its firing rate.",
        "Demonstrates the mechanism across more than one network topology."
      ],
      methods: ["Neural networks", "Effective connectivity", "Transfer entropy", "Dynamic routing"],
      links: {
        doi: "https://doi.org/10.1016/j.neuroimage.2017.11.014"
      },
      visual: { kind: "routing", label: "Dynamical hubs" }
    },
    {
      slug: "magnetic-lattice-ultracold-atoms",
      year: "2013",
      type: "Journal article",
      title: "A two-dimensional permanent magnetic lattice for ultracold atoms",
      venue: "Physica Scripta, 88(1), 015601",
      citation: "Physica Scripta 88, 015601 (2013).",
      authors: "A. Mohammadi, S. Ghanbari, and A. Pariz",
      simpleSummary:
        "The paper proposes an atom-chip design that uses patterned permanent magnetic films to create a two-dimensional array of tiny traps for ultracold atoms.",
      question: "Can permanent magnetic materials create a scalable lattice of stable microtraps without relying on current-carrying wires?",
      approach:
        "Analytical and numerical calculations were used to design crossed patterned magnetic layers that generate Ioffe-Pritchard microtraps for ultracold atoms and Bose-Einstein condensates.",
      result:
        "The proposed geometry produced a periodic two-dimensional trapping landscape with tunable field properties suitable for atom-chip applications.",
      contributions: [
        "Proposes a permanent-magnet route to two-dimensional atom trapping.",
        "Analyzes a crossed-layer geometry and its trap parameters.",
        "Connects microfabricated magnetic structures with ultracold-atom control."
      ],
      methods: ["Atom chips", "Magnetic microtraps", "Ultracold atoms", "Field modeling"],
      links: {
        record: "https://www.osti.gov/etdeweb/biblio/22125995"
      },
      visual: { kind: "lattice", label: "Magnetic trapping lattice" }
    }
  ],

  worksInProgress: [
    {
      status: "Manuscript",
      title: "Noise-like fluctuations drive shifts in 1/f-alpha power-law dynamics associated with changes in brain states",
      note: "A developing study of how noise-like fluctuations may accompany transitions in 1/f and alpha-band dynamics. Details are limited to the title in the supplied CV.",
      url: ""
    },
    {
      status: "Manuscript",
      title: "Network-Level Responses to iTBS Pulse Dose: A Non-Linear Pattern Detected with TMS-EEG",
      note: "A study of whether network responses scale linearly with intermittent theta-burst pulse dose. Public abstract not yet available in the supplied materials.",
      url: ""
    },
    {
      status: "In preparation",
      title: "Myelin-mediated control on neural excitability, correlations and synaptic plasticity",
      note: "A developing project on how myelin may shape excitability and plasticity. Details are limited to the title in the supplied CV.",
      url: ""
    },
    {
      status: "In preparation",
      title: "Silence Through Coherence",
      note: "A developing project listed in the CV. A public summary should be added only when an abstract is available.",
      url: ""
    }
  ],

  posts: [
    {
      id: "sample-biological-dose",
      sample: true,
      kind: "Research note",
      date: "2026-07-28",
      title: "The same electric field is not necessarily the same biological dose",
      excerpt:
        "Field magnitude is only one part of the intervention. Orientation, morphology, ongoing activity, membrane time scales, and connectivity can change what that field means to a circuit. Differences in brain anatomy mean that the same delivered current can leave some participants below a target electric-field threshold. Dose selection should consider whether each participant receives at least the intended minimum field.",
      prompt: "Possible expansion: define a biological-dose framework that separates delivered field, cellular polarization, network response, and behavioral outcome.",
      url: "",
      tags: ["Electric-field modeling", "Precision stimulation"]
    },
    {
      id: "sample-delay-control",
      sample: true,
      kind: "Open question",
      date: "2026-07-05",
      title: "Can network delay become a parameter for personalized stimulation?",
      excerpt:
        "Most stimulation protocols tune frequency and amplitude. Yet conduction delay changes phase relations and may determine whether two regions communicate, ignore one another, or reverse sender–receiver roles.",
      prompt: "Possible expansion: combine diffusion MRI, tract length, and individual alpha frequency to estimate a subject-specific phase offset.",
      url: "",
      tags: ["Delay", "Phase", "Personalization"]
    },
    
    {
      id: "sample-heterogeneity",
      sample: true,
      kind: "Concept sketch",
      date: "2026-05-22",
      title: "When should heterogeneity be preserved rather than averaged away?",
      excerpt:
        "Variability can be measurement noise, a nuisance parameter, a source of resilience, or the very mechanism that makes selective control possible. The scientific task is to distinguish these cases.",
      prompt: "Possible expansion: organize examples across cells, layers, subjects, and clinical groups.",
      url: "",
      tags: ["Heterogeneity", "Resilience"]
    }
  ],

  concepts: [
    {
      term: "Effective connectivity",
      category: "Networks",
      short: "The directed influence one neural population exerts on another during a particular brain state.",
      why:
        "Anatomical connections may be fixed and bidirectional while the functional direction of influence changes with firing rate, phase, delay, task, or stimulation.",
      example: "A faster node can become the effective sender even when structural connections are symmetric.",
      connections: ["Structural connectivity", "Information transfer", "Dynamic routing"]
    },
    {
      term: "Communication through coherence",
      category: "Oscillations",
      short: "The idea that aligned oscillatory phases open more effective windows for communication between brain regions.",
      why:
        "Phase alignment changes when spikes arrive relative to periods of high and low excitability. Delay and frequency mismatch determine whether that alignment persists.",
      example: "Two regions can share an anatomical pathway but exchange little information when their excitability windows are misaligned.",
      connections: ["Phase relation", "Axonal delay", "Frequency detuning"]
    },
    {
      term: "Collective phase-response curve",
      category: "Oscillations",
      short: "A description of how a population-level oscillation shifts in phase after receiving a perturbation.",
      why:
        "It links the timing of an incoming signal to whether the population advances, delays, or barely changes its rhythm, and therefore helps predict information transfer.",
      example: "The same input can improve or impair communication depending on the phase at which it arrives.",
      connections: ["Phase response", "Synchronization", "Information flow"]
    },
    {
      term: "Frequency detuning",
      category: "Oscillations",
      short: "The difference between the natural frequencies of two interacting oscillators or neural populations.",
      why:
        "Small differences can create phase drift, selective locking, or directional communication. Detuning is not always harmful; it can help define sender–receiver roles.",
      example: "A cortical population oscillating slightly faster than another may transmit better only for certain delays.",
      connections: ["Entrainment", "Phase locking", "Axonal delay"]
    },
    {
      term: "Axonal delay",
      category: "Networks",
      short: "The time required for a neural signal to travel from one cell or brain region to another.",
      why:
        "Even millisecond-scale delays change arrival phase and can alter synchronization, effective connectivity, and the direction of information transfer.",
      example: "A delay that aligns one frequency may misalign another.",
      connections: ["Conduction velocity", "Phase", "White matter"]
    },
    {
      term: "tACS entrainment",
      category: "Stimulation",
      short: "The tendency of an ongoing neural rhythm to align with an externally applied alternating electric field.",
      why:
        "Entrainment depends on stimulation frequency, amplitude, waveform, brain state, and the nonlinear dynamics of the targeted circuit—not frequency matching alone.",
      example: "A rhythm may lock during stimulation but return immediately afterward unless plasticity is also engaged.",
      connections: ["Resonance", "Phase locking", "Aftereffects"]
    },
    {
      term: "Spike-timing-dependent plasticity",
      category: "Plasticity",
      short: "A learning rule in which synaptic change depends on the relative timing of pre- and postsynaptic spikes.",
      why:
        "Periodic stimulation can shift spike timing and therefore strengthen one synaptic direction while weakening the reverse direction.",
      example: "If presynaptic spikes repeatedly precede postsynaptic spikes, that connection may potentiate under a chosen STDP rule.",
      connections: ["Hebbian learning", "tACS", "Synaptic weight"]
    },
    {
      term: "Neural heterogeneity",
      category: "Biology",
      short: "Variation among neurons in morphology, excitability, time constants, connectivity, and molecular properties.",
      why:
        "Heterogeneity can blur targeting, but it can also create selective frequency tuning, prevent unstable transitions, and increase coding capacity.",
      example: "Different membrane time constants can make a common tACS waveform change selected synapses more than others.",
      connections: ["Membrane time constant", "Resilience", "Cell type"]
    },
    {
      term: "Brain-state dependence",
      category: "Stimulation",
      short: "The principle that the effect of stimulation depends on the neural activity present when the stimulus is delivered.",
      why:
        "The same physical input may interact differently with resting, task-engaged, oscillatory, medicated, or pathological states.",
      example: "Stimulation near an endogenous rhythm may amplify it in one state and have little effect in another.",
      connections: ["Closed-loop stimulation", "Entrainment", "Variability"]
    },
    {
      term: "TMS-EEG",
      category: "Measurement",
      short: "A method that perturbs cortex with transcranial magnetic stimulation and records the resulting electrical response with EEG.",
      why:
        "It provides a direct perturb-and-measure view of cortical reactivity and network propagation, but requires careful artifact control and interpretation.",
      example: "A TMS pulse over prefrontal cortex can reveal both local evoked activity and later responses in connected regions.",
      connections: ["Effective connectivity", "TMS-evoked potential", "Artifact removal"]
    },
    {
      term: "Electric-field modeling",
      category: "Stimulation",
      short: "Computational estimation of the field produced in the head and brain by a chosen electrode or coil configuration.",
      why:
        "The delivered current is not the same as the field at the target. Anatomy, tissue conductivity, montage geometry, and distance to cortex shape the effective dose.",
      example: "Two people receiving the same tES current can experience different field strengths and orientations at the same cortical target.",
      connections: ["SimNIBS", "Dose", "Subject-specific modeling"]
    },
    {
      term: "Computational psychiatry",
      category: "Translation",
      short: "The use of quantitative models to connect behavior, brain dynamics, and psychiatric symptoms.",
      why:
        "Models can define latent mechanisms, predict individual response, and make treatment hypotheses explicit enough to test.",
      example: "A stimulation model may predict which frontoparietal phase relation is associated with lower craving.",
      connections: ["Precision medicine", "Decision making", "Network neuroscience"]
    },
    {
      term: "Virtual brain",
      category: "Translation",
      short: "A personalized computational model that combines an individual's anatomy, connectivity, and dynamics.",
      why:
        "Its value lies in generating testable predictions about stimulation, disease mechanisms, or treatment response—not merely reproducing a realistic image.",
      example: "Candidate stimulation settings can be simulated before selecting a protocol for empirical testing.",
      connections: ["Digital twin", "Neuroimaging", "Model validation"]
    },
    {
      term: "Clinical trial",
      category: "Clinical study design",
      short: "A prospective study in which people are assigned to one or more interventions so researchers can evaluate health-related outcomes.",
      why:
        "A clinical trial tests what happens after an intervention is deliberately assigned. This distinguishes it from an observational study, in which treatment or exposure is not assigned by the research protocol.",
      example: "Participants are assigned to active or sham tDCS, and depressive symptoms are measured before and after treatment.",
      connections: ["Interventional study", "Protocol", "Outcome measure"]
    },
    {
      term: "Interventional study",
      category: "Clinical study design",
      short: "A study in which the protocol prospectively assigns an intervention to evaluate its effect on biomedical or behavioral outcomes.",
      why:
        "The intervention may be a drug, device, stimulation protocol, behavioral treatment, diagnostic strategy, or another planned exposure. Assignment may be randomized or nonrandomized.",
      example: "A study assigns participants to two different tACS montages and compares target engagement.",
      connections: ["Clinical trial", "Experimental arm", "Allocation"]
    },
    {
      term: "Observational study",
      category: "Clinical study design",
      short: "A study in which researchers measure health outcomes without assigning the intervention or exposure being studied.",
      why:
        "Observational studies can describe associations and real-world patterns, but treatment selection and other confounders can make causal interpretation more difficult.",
      example: "Researchers compare outcomes among patients who previously received different clinical TMS protocols without assigning those treatments.",
      connections: ["Clinical trial", "Confounding", "Real-world evidence"]
    },
    {
      term: "Open-label study",
      category: "Controls & masking",
      short: "A study in which participants and investigators know which treatment each participant receives.",
      why:
        "Open-label designs can be practical for early safety, feasibility, or implementation questions, but expectations and observer judgments may influence reported outcomes.",
      example: "Every participant receives active TMS, and both the participant and treatment team know that the stimulation is active.",
      connections: ["Masking", "Expectancy effect", "Off-label use"]
    },
    {
      term: "Off-label use",
      category: "Regulation",
      short: "Clinical use of an approved or cleared medical product outside the indication, population, dose, parameters, or other conditions in its authorized labeling.",
      why:
        "Off-label describes how a treatment is used in clinical practice; it does not describe whether a study is blinded. Open-label and off-label therefore mean different things.",
      example: "A cleared stimulation device is used for a disorder or stimulation schedule not included in its authorized labeling.",
      connections: ["Open-label study", "Indication for use", "Investigational use"]
    },
    {
      term: "Randomized controlled trial",
      category: "Clinical study design",
      short: "A trial in which chance assigns participants to intervention groups that are then compared.",
      why:
        "Randomization helps balance measured and unmeasured baseline factors between groups, making differences in outcomes more plausibly attributable to the assigned interventions.",
      example: "A computer-generated sequence assigns participants to active or sham stimulation.",
      connections: ["Randomization", "Control group", "Allocation concealment"]
    },
    {
      term: "Parallel-group design",
      category: "Clinical study design",
      short: "A design in which separate groups receive different interventions during the same study period.",
      why:
        "Parallel groups avoid carryover from one treatment period to another, but usually require more participants than a within-person crossover comparison.",
      example: "One group receives active iTBS and another receives sham iTBS throughout the trial.",
      connections: ["Crossover design", "Control group", "Between-group comparison"]
    },
    {
      term: "Crossover design",
      category: "Clinical study design",
      short: "A design in which each participant receives two or more interventions in an assigned sequence.",
      why:
        "Each participant can serve as their own control, reducing between-person variability. The design is less suitable when treatment effects persist or the condition changes substantially over time.",
      example: "A participant receives active tACS in one period and sham tACS in another, with the order randomized.",
      connections: ["Washout period", "Carryover effect", "Within-subject design"]
    },
    {
      term: "Washout period",
      category: "Clinical study design",
      short: "A planned interval between treatment periods intended to allow the effect of the earlier intervention to diminish.",
      why:
        "An inadequate washout can contaminate the next condition, especially when neuromodulation produces lasting plasticity or clinical aftereffects.",
      example: "Active and sham stimulation sessions are separated by enough time to reduce residual effects from the first session.",
      connections: ["Crossover design", "Carryover effect", "Aftereffects"]
    },
    {
      term: "Carryover effect",
      category: "Clinical study design",
      short: "A residual effect from an earlier treatment period that influences outcomes in a later period.",
      why:
        "Carryover can bias crossover comparisons and may be difficult to eliminate when the intervention is intended to produce durable neural or clinical changes.",
      example: "Plastic changes from the first tACS condition remain present when the participant begins the second condition.",
      connections: ["Crossover design", "Washout period", "Period effect"]
    },
    {
      term: "Sham control",
      category: "Controls & masking",
      short: "A control procedure designed to resemble an active intervention without delivering its intended therapeutic component.",
      why:
        "For neuromodulation, a credible sham should approximate sensations, sounds, procedures, and expectations while minimizing the active biological dose. Sham is not automatically physiologically inert.",
      example: "A sham TMS coil reproduces sound and some scalp sensation while greatly reducing the induced cortical field.",
      connections: ["Placebo comparator", "Blinding integrity", "Expectancy effect"]
    },
    {
      term: "Active comparator",
      category: "Controls & masking",
      short: "A comparison condition that uses an established or meaningful active intervention rather than an inactive control.",
      why:
        "An active comparator asks whether a new treatment performs better than, similarly to, or no worse than an existing option. It answers a different question from comparison with sham.",
      example: "A personalized TMS protocol is compared with a standard FDA-cleared protocol.",
      connections: ["Sham control", "Superiority trial", "Noninferiority trial"]
    },
    {
      term: "Treatment-as-usual control",
      category: "Controls & masking",
      short: "A comparison group that continues the care normally available in the relevant clinical setting.",
      why:
        "Treatment as usual can show whether adding a new intervention improves real-world care, but the usual care must be described because it can vary across sites and clinicians.",
      example: "Participants receive standard addiction treatment with or without an added neuromodulation intervention.",
      connections: ["Active comparator", "Pragmatic trial", "Standard of care"]
    },
    {
      term: "Masking (blinding)",
      category: "Controls & masking",
      short: "A design strategy in which one or more parties do not know which intervention a participant was assigned.",
      why:
        "Participants, treating staff, investigators, and outcome assessors can be masked separately. Randomization does not by itself guarantee masking.",
      example: "Participants and symptom raters are masked, while a separate operator programs the stimulation device.",
      connections: ["Open-label study", "Outcome assessor", "Blinding integrity"]
    },
    {
      term: "Allocation concealment",
      category: "Controls & masking",
      short: "Protection of the upcoming assignment sequence so enrollment decisions cannot be influenced by knowing the next treatment.",
      why:
        "Allocation concealment prevents selection bias before assignment, whereas masking limits bias after assignment. The two safeguards solve different problems.",
      example: "The enrolling investigator cannot view the next active or sham assignment in the randomization system.",
      connections: ["Randomization", "Masking", "Selection bias"]
    },
    {
      term: "Blinding integrity",
      category: "Controls & masking",
      short: "The extent to which participants and study personnel remain unaware of treatment assignment.",
      why:
        "Stimulation sensations, coil sounds, side effects, or device behavior can reveal assignment. Asking participants and staff to guess the condition helps evaluate whether the blind was credible.",
      example: "After active or sham TMS, participants report which condition they think they received and why.",
      connections: ["Masking", "Sham control", "Expectancy effect"]
    },
    {
      term: "Expectancy effect",
      category: "Controls & masking",
      short: "A change in symptoms, behavior, or reporting related to what a participant expects the treatment to do.",
      why:
        "Expectation can contribute to outcomes in both active and sham groups. Measuring treatment credibility and expectations can help interpret an apparent stimulation effect.",
      example: "Participants who strongly believe they received active stimulation report greater symptom improvement regardless of assignment.",
      connections: ["Placebo effect", "Sham control", "Blinding integrity"]
    },
    {
      term: "Outcome measure",
      category: "Clinical outcomes",
      short: "A prespecified measurement used to determine how an intervention affects participants.",
      why:
        "An outcome must specify exactly what is measured, how it is calculated, and when it is assessed. A vague goal such as improvement is not an adequate outcome definition.",
      example: "Change in a validated craving score from baseline to four weeks after treatment.",
      connections: ["Primary outcome", "Secondary outcome", "Time frame"]
    },
    {
      term: "Primary outcome",
      category: "Clinical outcomes",
      short: "The outcome measure of greatest importance for evaluating the intervention's main effect.",
      why:
        "The primary outcome usually drives the main hypothesis and sample-size calculation. Defining it in advance limits selective emphasis on whichever result looks most favorable.",
      example: "The prespecified primary outcome is change in depression severity at the end of a four-week TMS course.",
      connections: ["Secondary outcome", "Sample size", "Preregistration"]
    },
    {
      term: "Secondary outcome",
      category: "Clinical outcomes",
      short: "A prespecified outcome that is important but not the trial's main measure of treatment effect.",
      why:
        "Secondary outcomes can examine additional symptoms, mechanisms, safety, functioning, or durability, but multiple comparisons require cautious interpretation.",
      example: "Craving is primary, while sleep, mood, EEG connectivity, and treatment retention are secondary outcomes.",
      connections: ["Primary outcome", "Multiplicity", "Exploratory outcome"]
    },
    {
      term: "Biomarker endpoint",
      category: "Clinical outcomes",
      short: "A biological measurement used to indicate target engagement, physiological change, risk, or possible treatment effect.",
      why:
        "A biomarker can explain mechanism or show that stimulation reached its target, but a biomarker improvement does not automatically mean that patients feel or function better.",
      example: "An electric-field threshold or a change in frontoparietal connectivity is evaluated alongside clinical symptoms.",
      connections: ["Target engagement", "Surrogate endpoint", "Clinical outcome"]
    },
    {
      term: "Responder",
      category: "Clinical outcomes",
      short: "A participant who meets a prespecified threshold for meaningful improvement.",
      why:
        "The threshold depends on the disorder, scale, and protocol. In many depression trials, response is commonly defined as at least a 50% reduction in symptom severity, but every study must state its exact rule.",
      example: "A participant whose depression score decreases by at least 50% from baseline is classified as a responder under the protocol.",
      connections: ["Response rate", "Remission", "Clinically meaningful change"]
    },
    {
      term: "Response rate",
      category: "Clinical outcomes",
      short: "The proportion of analyzed participants who meet the study's predefined responder criterion.",
      why:
        "Response rate is easy to communicate clinically, but it depends strongly on the chosen threshold, analysis population, missing-data method, and assessment time.",
      example: "The trial compares the percentage of responders after active versus sham stimulation.",
      connections: ["Responder", "Risk difference", "Number needed to treat"]
    },
    {
      term: "Remission",
      category: "Clinical outcomes",
      short: "A clinical state in which symptoms fall below a prespecified low-severity threshold, even though future relapse may remain possible.",
      why:
        "Remission is usually more stringent than response: a person can improve by 50% yet still have substantial symptoms. The exact cutoff and measurement time must be defined in the protocol.",
      example: "A participant improves markedly but counts as remitted only if the final depression score is below the predefined remission cutoff.",
      connections: ["Responder", "Remission rate", "Relapse"]
    },
    {
      term: "Remission rate",
      category: "Clinical outcomes",
      short: "The proportion of analyzed participants who meet the study's predefined remission criterion at a specified time.",
      why:
        "Remission rate can be more clinically informative than average symptom change, but comparisons require the same cutoff, time point, and handling of missing outcomes.",
      example: "The percentage in remission is compared between individualized-dose and fixed-dose stimulation groups.",
      connections: ["Remission", "Response rate", "Clinical endpoint"]
    },
    {
      term: "Relapse",
      category: "Clinical outcomes",
      short: "The return or worsening of symptoms after a participant had achieved remission or substantial improvement.",
      why:
        "Short-term response does not establish durability. Follow-up assessments are needed to distinguish temporary improvement from sustained clinical benefit.",
      example: "Symptoms return during follow-up after remission at the end of the stimulation course.",
      connections: ["Remission", "Durability", "Maintenance treatment"]
    },
    {
      term: "Minimal clinically important difference",
      category: "Clinical outcomes",
      short: "The smallest change in an outcome that is considered meaningful to patients or clinical decision-making.",
      why:
        "A statistically detectable difference may be too small to matter clinically. The meaningful threshold should be justified for the population, scale, and context.",
      example: "A two-point group difference is statistically significant but is smaller than the accepted clinically important change on the scale.",
      connections: ["Clinical significance", "Effect size", "Responder"]
    },
    {
      term: "Clinical versus statistical significance",
      category: "Clinical outcomes",
      short: "Statistical significance concerns compatibility with a null model; clinical significance concerns whether the effect is large and meaningful enough to matter.",
      why:
        "A small effect can become statistically significant in a large sample, while a clinically important effect may remain uncertain in a small trial. Both magnitude and uncertainty should be reported.",
      example: "Active stimulation differs from sham with p < 0.05, but the symptom difference is too small to change treatment decisions.",
      connections: ["Effect size", "Confidence interval", "Minimal clinically important difference"]
    },
    {
      term: "Inclusion and exclusion criteria",
      category: "Recruitment & conduct",
      short: "Predefined characteristics that determine who may or may not participate in a study.",
      why:
        "These criteria protect participants, define the intended population, reduce avoidable confounding, and determine how broadly the results can be generalized.",
      example: "Eligibility specifies diagnosis, age range, medication stability, TMS contraindications, and prior treatment exposure.",
      connections: ["Eligibility", "External validity", "Safety screening"]
    },
    {
      term: "Informed consent",
      category: "Ethics & safety",
      short: "An ongoing process in which a person receives understandable study information and voluntarily decides whether to participate.",
      why:
        "Consent should explain purpose, procedures, risks, potential benefits, alternatives, confidentiality, compensation, and the right to withdraw without penalty.",
      example: "Before any research procedure, the participant discusses the protocol and signs the IRB-approved consent form.",
      connections: ["IRB", "Voluntary participation", "Capacity to consent"]
    },
    {
      term: "Institutional Review Board (IRB)",
      category: "Ethics & safety",
      short: "An independent committee that reviews human-subject research to protect participants' rights, safety, and welfare.",
      why:
        "The IRB evaluates the risk-benefit balance, consent process, recruitment, privacy, safety monitoring, and protocol changes. IRB approval does not itself prove that an intervention is effective.",
      example: "A neuromodulation protocol and its consent form are approved by the IRB before enrollment begins.",
      connections: ["Informed consent", "Protocol amendment", "Human-subject protection"]
    },
    {
      term: "Adverse event",
      category: "Ethics & safety",
      short: "Any unfavorable medical occurrence during a study, whether or not it was caused by the intervention.",
      why:
        "Recording an adverse event documents what happened; it does not establish causality. Investigators separately assess severity, seriousness, expectedness, and relatedness.",
      example: "A headache after TMS is recorded as an adverse event even if another cause is considered more likely.",
      connections: ["Serious adverse event", "Relatedness", "Safety endpoint"]
    },
    {
      term: "Serious adverse event",
      category: "Ethics & safety",
      short: "An adverse event meeting regulatory seriousness criteria such as death, life threat, hospitalization, disability, or another important medical event.",
      why:
        "Seriousness describes the consequence or required action, not simply symptom intensity. A severe headache may be non-serious, while a moderate event requiring hospitalization may be serious.",
      example: "An event requiring inpatient hospitalization is assessed and reported as serious even if its symptoms were not rated severe.",
      connections: ["Adverse event", "Severity", "Safety reporting"]
    },
    {
      term: "Severity versus seriousness",
      category: "Ethics & safety",
      short: "Severity describes intensity, whereas seriousness is a regulatory classification based on outcomes such as hospitalization or life threat.",
      why:
        "The terms are not interchangeable. Correct classification is essential for safety monitoring and reporting timelines.",
      example: "Severe transient scalp pain can be non-serious, while a less intense event that causes hospitalization is serious.",
      connections: ["Adverse event", "Serious adverse event", "Safety monitoring"]
    },
    {
      term: "Adverse-event relatedness",
      category: "Ethics & safety",
      short: "The investigator's assessment of how likely an adverse event is to have been caused by the study intervention or procedure.",
      why:
        "Temporal proximity alone does not prove causation. Relatedness considers timing, known effects, alternative explanations, dose relationships, and what happens after stopping or repeating exposure.",
      example: "Headache beginning during stimulation may be judged possibly related, while an unrelated injury may be judged unrelated.",
      connections: ["Adverse event", "Causality", "Expectedness"]
    },
    {
      term: "Data and Safety Monitoring Board",
      category: "Ethics & safety",
      short: "An independent group that periodically reviews accumulating trial data, especially safety and overall study conduct.",
      why:
        "A monitoring board can recommend continuing, modifying, pausing, or stopping a study based on prespecified rules while protecting trial integrity.",
      example: "An independent board reviews serious events and enrollment data without revealing treatment assignments to the study team.",
      connections: ["Stopping rule", "Interim analysis", "Participant safety"]
    },
    {
      term: "Protocol deviation",
      category: "Recruitment & conduct",
      short: "A departure from the IRB-approved protocol, study procedures, or planned schedule.",
      why:
        "Deviations should be documented and assessed for effects on safety, participant rights, and data integrity. Major deviations may affect whether data belong in a per-protocol analysis.",
      example: "A stimulation session is delivered outside the permitted timing window or at an incorrect intensity.",
      connections: ["Protocol amendment", "Per-protocol analysis", "Data quality"]
    },
    {
      term: "Treatment adherence",
      category: "Recruitment & conduct",
      short: "The extent to which a participant receives or follows the intervention as specified in the protocol.",
      why:
        "Low adherence can dilute the estimated effect of assignment and make efficacy harder to interpret. Adherence should be measured rather than assumed.",
      example: "A participant completes 15 of 20 planned stimulation sessions and the missed sessions are documented.",
      connections: ["Intention-to-treat", "Per-protocol analysis", "Treatment exposure"]
    },
    {
      term: "Attrition",
      category: "Recruitment & conduct",
      short: "Loss of participants from treatment, follow-up, or outcome assessment during a study.",
      why:
        "Attrition reduces precision and can bias results when dropout is related to treatment, side effects, or outcomes. Reasons should be reported by group.",
      example: "More participants leave the active-stimulation arm because of discomfort, creating unequal missing outcome data.",
      connections: ["Missing data", "Participant flow", "Retention"]
    },
    {
      term: "Trial registration",
      category: "Regulation",
      short: "Public posting of key protocol information in a recognized registry before or during study conduct, as applicable.",
      why:
        "Registration makes the study design, outcomes, enrollment, and status visible and helps detect selective reporting or undisclosed changes.",
      example: "After IRB and institutional requirements are addressed, the protocol is posted on ClinicalTrials.gov with its outcomes and study design.",
      connections: ["ClinicalTrials.gov", "NCT number", "Preregistration"]
    },
    {
      term: "NCT number",
      category: "Regulation",
      short: "The unique identifier assigned to a study record registered on ClinicalTrials.gov.",
      why:
        "An NCT number links the public protocol record, recruitment status, locations, outcomes, and—when posted—summary results.",
      example: "A website protocol card links directly to its ClinicalTrials.gov record using the NCT identifier.",
      connections: ["Trial registration", "ClinicalTrials.gov", "Study record"]
    },
    {
      term: "Investigational Device Exemption (IDE)",
      category: "Regulation",
      short: "An FDA pathway that, when required, permits an investigational device to be used in a clinical study to collect safety and effectiveness data.",
      why:
        "Device studies may also require an IRB-approved investigational plan, informed consent, monitoring, labeling, and records. Requirements depend on the device and study risk.",
      example: "A significant-risk neuromodulation-device study obtains the required FDA and IRB authorization before beginning.",
      connections: ["Investigational device", "IRB", "Significant risk"]
    },
    {
      term: "Intention-to-treat analysis",
      category: "Clinical analysis",
      short: "An analysis that keeps participants in the groups to which they were originally randomized, regardless of adherence or treatment received.",
      why:
        "This approach preserves the comparison created by randomization and estimates the effect of treatment assignment, although missing outcomes still require careful handling.",
      example: "A participant assigned to active TMS remains in the active group analysis even after missing several sessions.",
      connections: ["Randomization", "Per-protocol analysis", "Missing data"]
    },
    {
      term: "Per-protocol analysis",
      category: "Clinical analysis",
      short: "An analysis restricted to participants who met prespecified requirements for treatment exposure and protocol adherence.",
      why:
        "It can address the effect among sufficiently adherent participants, but excluding people after randomization can introduce bias. Criteria should be defined before outcomes are examined.",
      example: "The analysis includes only participants who completed at least 18 of 20 correctly delivered sessions.",
      connections: ["Intention-to-treat", "Treatment adherence", "Protocol deviation"]
    },
    {
      term: "Sample size and statistical power",
      category: "Clinical analysis",
      short: "Sample-size planning estimates how many participants are needed to detect or estimate an effect with acceptable precision under stated assumptions.",
      why:
        "An underpowered trial may miss clinically important effects, while unrealistic effect-size assumptions can produce an inadequate sample. Expected attrition should also be considered.",
      example: "The calculation uses the primary outcome, expected active-sham difference, variability, significance level, desired power, and dropout allowance.",
      connections: ["Primary outcome", "Effect size", "Attrition"]
    },
    {
      term: "Effect size and confidence interval",
      category: "Clinical analysis",
      short: "Effect size describes the magnitude of a difference or association; a confidence interval describes the range of values compatible with the data under the model.",
      why:
        "Together they communicate more than a p-value by showing how large the effect may be and how precisely it was estimated.",
      example: "The active-sham symptom difference is reported with a 95% confidence interval rather than only as significant or nonsignificant.",
      connections: ["Clinical significance", "Statistical uncertainty", "P-value"]
    },
    {
      term: "Prespecified analysis",
      category: "Clinical analysis",
      short: "An analysis defined in the protocol or statistical analysis plan before treatment assignments or outcomes are examined.",
      why:
        "Prespecification reduces the risk of choosing favorable outcomes, subgroups, time points, or models after seeing the data.",
      example: "The primary time point, covariates, missing-data method, and responder threshold are fixed before unblinding.",
      connections: ["Preregistration", "Primary outcome", "Exploratory analysis"]
    },
    {
      term: "Multiplicity",
      category: "Clinical analysis",
      short: "The increased chance of false-positive findings when many outcomes, groups, time points, or statistical tests are examined.",
      why:
        "A trial should distinguish confirmatory from exploratory analyses and use an appropriate strategy when several hypotheses are tested.",
      example: "Testing ten EEG bands and five clinical scales without adjustment can produce apparently significant results by chance.",
      connections: ["Secondary outcome", "False-positive rate", "Prespecified analysis"]
    },
    {
      term: "Superiority trial",
      category: "Clinical study design",
      short: "A trial designed to determine whether one intervention produces better outcomes than a comparator by a prespecified criterion.",
      why:
        "Failure to demonstrate superiority does not prove that treatments are equivalent. The comparison and clinically meaningful difference must be defined in advance.",
      example: "An anatomy-informed stimulation dose is tested for a higher remission rate than fixed-dose stimulation.",
      connections: ["Active comparator", "Noninferiority trial", "Effect size"]
    },
    {
      term: "Noninferiority trial",
      category: "Clinical study design",
      short: "A trial designed to determine whether a new intervention is not unacceptably worse than an active comparator by more than a prespecified margin.",
      why:
        "The noninferiority margin must be clinically justified. This design may be useful when the new option offers advantages in safety, cost, access, or burden.",
      example: "A shorter TMS schedule is tested to determine whether its efficacy is not meaningfully worse than a standard schedule.",
      connections: ["Superiority trial", "Active comparator", "Noninferiority margin"]
    },
    {
      term: "Pilot and feasibility study",
      category: "Clinical study design",
      short: "A preliminary study focused mainly on whether a larger definitive trial can and should be conducted as planned.",
      why:
        "Feasibility outcomes include recruitment, retention, tolerability, adherence, blinding, and data completeness. A small pilot is usually not designed to establish clinical efficacy.",
      example: "A pilot evaluates whether participants can complete concurrent fMRI-tES sessions and whether the sham remains credible.",
      connections: ["Recruitment rate", "Acceptability", "Definitive trial"]
    }
  ]
};
