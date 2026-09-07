/*
 * Approximate scalp-to-cortex descriptions for rapid visualization.
 * These are not subject-specific anatomical localizations. The categories
 * summarize common cortical territories beneath international 10-20/10-10
 * positions and link to external anatomy/function references.
 */
window.EEG_REGION_LIBRARY = {
  frontopolar: {
    region: "Frontopolar and anterior prefrontal cortex",
    functions: "Commonly associated with prospective planning, monitoring multiple goals, metacognition, and integrating information over longer time scales.",
    sourceLabel: "NCBI Bookshelf — The Frontal Cortex",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK609778/",
    anatomyLabel: "Frontal cortex anatomy and functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554483/"
  },
  dlpfc: {
    region: "Dorsolateral prefrontal cortex / middle frontal gyrus",
    functions: "Frequently involved in working memory, cognitive control, goal maintenance, planning, and top-down attention. These functions arise from distributed networks rather than one isolated point.",
    sourceLabel: "NCBI Bookshelf — The Frontal Cortex",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK609778/",
    anatomyLabel: "Frontal cortex anatomy and functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554483/"
  },
  inferior_frontal: {
    region: "Inferior frontal and ventrolateral prefrontal cortex",
    functions: "Often participates in response selection and inhibition, semantic retrieval, and language production in the language-dominant hemisphere.",
    sourceLabel: "NCBI Bookshelf — Cerebral cortex functions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/",
    anatomyLabel: "Frontal cortex anatomy and functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554483/"
  },
  medial_frontal: {
    region: "Medial superior frontal cortex, pre-SMA, and supplementary motor territory",
    functions: "Associated with internally guided action, movement initiation and sequencing, motor planning, and performance monitoring.",
    sourceLabel: "NCBI Bookshelf — Frontal cortex anatomy",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554483/",
    anatomyLabel: "Precentral gyrus and motor cortex",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK544218/"
  },
  premotor: {
    region: "Premotor cortex and adjacent precentral gyrus",
    functions: "Supports preparation and selection of movements, sensorimotor integration, and transformation of sensory cues into actions.",
    sourceLabel: "NCBI Bookshelf — Precentral gyrus",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK544218/",
    anatomyLabel: "Motor and sensory cortex illustration",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK555915/figure/article-29224.image.f4/"
  },
  sensorimotor: {
    region: "Primary motor and primary somatosensory cortex near the central sulcus",
    functions: "The precentral side contributes to voluntary movement; the postcentral side processes touch, proprioception, pressure, and related somatic sensations. Representation is approximately contralateral and somatotopic.",
    sourceLabel: "NCBI Bookshelf — Precentral gyrus",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK544218/",
    anatomyLabel: "Primary somatosensory cortex illustration",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK555915/figure/article-29224.image.f1/"
  },
  somatosensory_parietal: {
    region: "Postcentral gyrus and somatosensory association cortex",
    functions: "Processes body sensation and proprioception and contributes to integrating sensory information for perception and action.",
    sourceLabel: "NCBI Bookshelf — Cerebral cortex functions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/",
    anatomyLabel: "Primary somatosensory cortex illustration",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK555915/figure/article-29224.image.f1/"
  },
  posterior_parietal: {
    region: "Superior/inferior posterior parietal cortex",
    functions: "Commonly involved in spatial attention, multisensory integration, body-space representation, visuomotor transformation, and action planning.",
    sourceLabel: "NCBI Bookshelf — Cerebral cortex functions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/",
    anatomyLabel: "Cerebral hemisphere and lobes",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK549789/"
  },
  medial_parietal: {
    region: "Precuneus, medial parietal cortex, and posterior cingulate vicinity",
    functions: "Linked to visuospatial imagery, episodic-memory retrieval, self-related processing, and default-mode network activity.",
    sourceLabel: "NCBI Bookshelf — Cerebral cortex functions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/",
    anatomyLabel: "Cerebral cortex anatomy",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK575742/"
  },
  temporoparietal: {
    region: "Temporoparietal junction and posterior temporal/inferior parietal cortex",
    functions: "Often participates in reorienting attention and multisensory integration; dominant-hemisphere regions also contribute to language, while right-sided regions are often implicated in social and spatial cognition.",
    sourceLabel: "NCBI Bookshelf — Cerebral cortex functions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/",
    anatomyLabel: "Temporal lobe anatomy and functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK519512/"
  },
  auditory_temporal: {
    region: "Superior and middle temporal cortex near auditory association territory",
    functions: "Supports auditory analysis and interpretation. Dominant-hemisphere posterior temporal regions often contribute to language comprehension; right-sided regions often contribute to prosody and nonverbal sound processing.",
    sourceLabel: "NCBI Bookshelf — Primary auditory cortex",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK554521/",
    anatomyLabel: "Temporal lobe anatomy and functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK519512/"
  },
  anterior_temporal: {
    region: "Anterior and inferior temporal association cortex",
    functions: "Associated with semantic knowledge, object and face processing, social-emotional meaning, and integration of multimodal information.",
    sourceLabel: "NCBI Bookshelf — Temporal lobe",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK519512/",
    anatomyLabel: "Cerebral cortex functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/"
  },
  parieto_occipital: {
    region: "Parieto-occipital and extrastriate visual association cortex",
    functions: "Contributes to higher-order visual analysis, visuospatial processing, visual attention, and integration of visual information with action.",
    sourceLabel: "NCBI Bookshelf — Visual cortex",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK482504/",
    anatomyLabel: "Cerebral cortex functions",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK538496/"
  },
  occipital_visual: {
    region: "Occipital visual cortex, including primary and extrastriate territory",
    functions: "Receives and processes visual information. Primary visual cortex represents the contralateral visual field, while surrounding areas support features such as form, motion, color, and visual recognition.",
    sourceLabel: "NCBI Bookshelf — Visual cortex",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK482504/",
    anatomyLabel: "Visual cortex anatomy",
    anatomyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK553189/"
  },
  inferior_edge: {
    region: "Inferior scalp near frontal, temporal, or occipital edge",
    functions: "The nearest superficial cortical territory depends strongly on individual anatomy and exact registration; this position may also be close to non-cerebral tissue or the skull base.",
    sourceLabel: "Okamoto et al. — probabilistic scalp-to-cortex correspondence",
    sourceUrl: "https://doi.org/10.1016/j.neuroimage.2003.08.026",
    anatomyLabel: "Koessler et al. — automated 10–10 cortical projection",
    anatomyUrl: "https://doi.org/10.1016/j.neuroimage.2009.02.006"
  },
  generic: {
    region: "Approximate superficial cortical territory",
    functions: "A more specific functional interpretation is not reliable from this label alone. Subject-specific electrode digitization, MRI coregistration, and an anatomical atlas are required for precise localization.",
    sourceLabel: "Koessler et al. — automated 10–10 cortical projection",
    sourceUrl: "https://doi.org/10.1016/j.neuroimage.2009.02.006",
    anatomyLabel: "Okamoto et al. — probabilistic scalp-to-cortex correspondence",
    anatomyUrl: "https://doi.org/10.1016/j.neuroimage.2003.08.026"
  }
};

window.EEG_ELECTRODE_REGION_OVERRIDES = {
  Fp1: { category: "frontopolar", scalp: "Left frontopolar scalp" },
  Fpz: { category: "frontopolar", scalp: "Midline frontopolar scalp" },
  Fp2: { category: "frontopolar", scalp: "Right frontopolar scalp" },
  AF3: { category: "frontopolar", scalp: "Left anterior frontal scalp" },
  AFz: { category: "frontopolar", scalp: "Midline anterior frontal scalp" },
  AF4: { category: "frontopolar", scalp: "Right anterior frontal scalp" },
  F1: { category: "medial_frontal", scalp: "Left superior frontal scalp near midline" },
  F2: { category: "medial_frontal", scalp: "Right superior frontal scalp near midline" },
  F3: { category: "dlpfc", scalp: "Left frontal scalp" },
  F4: { category: "dlpfc", scalp: "Right frontal scalp" },
  F5: { category: "dlpfc", scalp: "Left lateral frontal scalp" },
  F6: { category: "dlpfc", scalp: "Right lateral frontal scalp" },
  F7: { category: "inferior_frontal", scalp: "Left inferior-lateral frontal scalp" },
  F8: { category: "inferior_frontal", scalp: "Right inferior-lateral frontal scalp" },
  Fz: { category: "medial_frontal", scalp: "Midline frontal scalp" },
  FC1: { category: "premotor", scalp: "Left frontocentral scalp near midline" },
  FC2: { category: "premotor", scalp: "Right frontocentral scalp near midline" },
  FC3: { category: "premotor", scalp: "Left frontocentral scalp" },
  FC4: { category: "premotor", scalp: "Right frontocentral scalp" },
  FC5: { category: "premotor", scalp: "Left lateral frontocentral scalp" },
  FC6: { category: "premotor", scalp: "Right lateral frontocentral scalp" },
  FCz: { category: "medial_frontal", scalp: "Midline frontocentral scalp" },
  C1: { category: "sensorimotor", scalp: "Left central scalp near midline" },
  C2: { category: "sensorimotor", scalp: "Right central scalp near midline" },
  C3: { category: "sensorimotor", scalp: "Left central scalp" },
  C4: { category: "sensorimotor", scalp: "Right central scalp" },
  C5: { category: "sensorimotor", scalp: "Left lateral central scalp" },
  C6: { category: "sensorimotor", scalp: "Right lateral central scalp" },
  Cz: { category: "sensorimotor", scalp: "Midline central scalp" },
  CP1: { category: "somatosensory_parietal", scalp: "Left centroparietal scalp near midline" },
  CP2: { category: "somatosensory_parietal", scalp: "Right centroparietal scalp near midline" },
  CP3: { category: "somatosensory_parietal", scalp: "Left centroparietal scalp" },
  CP4: { category: "somatosensory_parietal", scalp: "Right centroparietal scalp" },
  CP5: { category: "temporoparietal", scalp: "Left lateral centroparietal scalp" },
  CP6: { category: "temporoparietal", scalp: "Right lateral centroparietal scalp" },
  CPz: { category: "medial_parietal", scalp: "Midline centroparietal scalp" },
  P1: { category: "medial_parietal", scalp: "Left parietal scalp near midline" },
  P2: { category: "medial_parietal", scalp: "Right parietal scalp near midline" },
  P3: { category: "posterior_parietal", scalp: "Left parietal scalp" },
  P4: { category: "posterior_parietal", scalp: "Right parietal scalp" },
  P5: { category: "posterior_parietal", scalp: "Left lateral parietal scalp" },
  P6: { category: "posterior_parietal", scalp: "Right lateral parietal scalp" },
  P7: { category: "temporoparietal", scalp: "Left posterior temporal/parietal scalp" },
  P8: { category: "temporoparietal", scalp: "Right posterior temporal/parietal scalp" },
  Pz: { category: "medial_parietal", scalp: "Midline parietal scalp" },
  PO3: { category: "parieto_occipital", scalp: "Left parieto-occipital scalp" },
  PO4: { category: "parieto_occipital", scalp: "Right parieto-occipital scalp" },
  PO7: { category: "parieto_occipital", scalp: "Left lateral parieto-occipital scalp" },
  PO8: { category: "parieto_occipital", scalp: "Right lateral parieto-occipital scalp" },
  POz: { category: "parieto_occipital", scalp: "Midline parieto-occipital scalp" },
  O1: { category: "occipital_visual", scalp: "Left occipital scalp" },
  O2: { category: "occipital_visual", scalp: "Right occipital scalp" },
  Oz: { category: "occipital_visual", scalp: "Midline occipital scalp" },
  Iz: { category: "inferior_edge", scalp: "Inferior midline occipital scalp near the inion" },
  T7: { category: "auditory_temporal", scalp: "Left lateral temporal scalp" },
  T8: { category: "auditory_temporal", scalp: "Right lateral temporal scalp" },
  FT7: { category: "inferior_frontal", scalp: "Left frontotemporal scalp" },
  FT8: { category: "inferior_frontal", scalp: "Right frontotemporal scalp" },
  TP7: { category: "temporoparietal", scalp: "Left temporoparietal scalp" },
  TP8: { category: "temporoparietal", scalp: "Right temporoparietal scalp" }
};

window.EEG_MAPPING_REFERENCES = [
  {
    label: "Koessler et al. (2009), automated cortical projection of 10–10 EEG sensors",
    url: "https://doi.org/10.1016/j.neuroimage.2009.02.006"
  },
  {
    label: "Okamoto et al. (2004), probabilistic 10–20 scalp-to-cortex correspondence",
    url: "https://doi.org/10.1016/j.neuroimage.2003.08.026"
  },
  {
    label: "Oostenveld & Praamstra (2001), international 10–5 electrode system",
    url: "https://doi.org/10.1016/S1388-2457(00)00527-7"
  }
];
