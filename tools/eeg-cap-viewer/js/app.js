(() => {
  "use strict";

  const CONFIG = window.EEG_VIEWER_CONFIG || {};
  const MONTAGES = window.EEG_MONTAGE_PRESETS || {};
  const REGION_LIBRARY = window.EEG_REGION_LIBRARY || {};
  const REGION_OVERRIDES = window.EEG_ELECTRODE_REGION_OVERRIDES || {};
  const MAPPING_REFERENCES = Array.isArray(window.EEG_MAPPING_REFERENCES) ? window.EEG_MAPPING_REFERENCES : [];
  const DEFAULT_MONTAGE_ID = CONFIG.defaultMontage || "international_1010";
  const DEFAULT_PRESET = MONTAGES[DEFAULT_MONTAGE_ID] || MONTAGES.international_1010 || null;
  const DEFAULT_COORDS = DEFAULT_PRESET?.electrodes || (Array.isArray(window.DEFAULT_EEG_1010) ? window.DEFAULT_EEG_1010 : []);
  const TEMPLATE_MESH = window.FSAVERAGE_SCALP_MESH || null;
  const CANONICAL_MNI_PRESET = MONTAGES.international_1005 || MONTAGES.mne_standard_1020 || DEFAULT_PRESET;
  const TEMPLATE_MNI_FIDUCIALS = {
    nasion: { x: 1.468, y: 85.067, z: -34.836 },
    lpa: { x: -80.616, y: -29.089, z: -41.311 },
    rpa: { x: 84.363, y: -28.503, z: -41.277 }
  };

  const CAMERA_VIEWS = {
    default: { eye: { x: 1.25, y: 1.35, z: 0.95 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0.06 } },
    front: { eye: { x: 0, y: 2.05, z: 0.1 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0.06 } },
    back: { eye: { x: 0, y: -2.05, z: 0.1 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0.06 } },
    left: { eye: { x: -2.05, y: 0, z: 0.1 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0.06 } },
    right: { eye: { x: 2.05, y: 0, z: 0.1 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0.06 } },
    top: { eye: { x: 0, y: 0, z: 2.15 }, up: { x: 0, y: 1, z: 0 }, center: { x: 0, y: 0, z: 0.08 } },
    bottom: { eye: { x: 0, y: 0, z: -2.15 }, up: { x: 0, y: 1, z: 0 }, center: { x: 0, y: 0, z: -0.03 } }
  };

  const DEFAULT_CONTROL_VALUES = {
    headModel: "template",
    autoFit: true,
    fitSource: "reference",
    projectElectrodes: true,
    comparisonLayout: "overlay",
    comparisonAlignment: "auto",
    syncCameras: true,
    clearance: 2,
    headScale: 1,
    headOpacity: 0.85,
    headColor: "#d8b49b",
    headContours: true,
    referenceColor: "#1769aa",
    referenceSize: 7,
    referenceOpacity: 1,
    comparisonColor: "#d1495b",
    comparisonSize: 7,
    comparisonOpacity: 0.82,
    showLabels: true,
    labelColor: "#172033",
    fontSize: 11,
    hitboxSize: 16,
    backgroundColor: "#f4f6f9",
    showLines: true,
    colorByDistance: false,
    lineOpacity: 0.65
  };

  const state = {
    reference: [],
    comparison: [],
    referenceName: CONFIG.defaultReferenceName || "International 10–10 reference",
    comparisonName: "Comparison cap",
    referencePresetId: DEFAULT_MONTAGE_ID,
    referenceIsDefault: true,
    hidden: { reference: new Set(), comparison: new Set() },
    visibilityEditMode: false,
    lastClicked: null,
    hoverPreview: null,
    currentView: "default",
    renderTimer: null,
    plotInitialized: false,
    comparisonRows: [],
    fitStatus: "",
    capContext: { reference: {}, comparison: {} },
    comparisonPresetId: "",
    dataRevision: 0,
    loadGeneration: { reference: 0, comparison: 0 },
    displayGeometry: null,
    camera: null,
    comparisonCamera: null,
    syncingCamera: false,
    renderBusy: false,
    renderAgain: false
  };

  const dom = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheDom() {
    const ids = [
      "app-shell", "app-header", "app-title", "app-subtitle", "version-badge",
      "montage-select", "montage-description", "comparison-montage-select", "reference-file-input", "comparison-file-input", "reference-units", "comparison-units",
      "restore-default-button", "clear-comparison-button", "reset-all-button", "fullscreen-button",
      "download-default-button", "download-comparison-button",
      "reference-file-status", "comparison-file-status", "reference-status-pill", "comparison-status-pill",
      "head-model-select", "auto-fit-checkbox", "fit-source-select", "project-electrodes-checkbox", "comparison-layout-select", "comparison-alignment-select", "sync-cameras-checkbox", "refit-head-button", "clearance-range",
      "head-scale-range", "head-opacity-range", "head-color-input", "head-contours-checkbox", "head-model-status",
      "reference-color-input", "reference-size-range", "reference-opacity-range", "comparison-color-input",
      "comparison-size-range", "comparison-opacity-range", "show-labels-checkbox", "label-color-input",
      "font-size-range", "hitbox-size-range", "background-color-input", "show-lines-checkbox",
      "color-by-distance-checkbox", "line-opacity-range", "display-mode-status", "display-projection-note", "comparison-frame-note", "clearance-output",
      "head-scale-output", "head-opacity-output", "reference-size-output", "reference-opacity-output",
      "comparison-size-output", "comparison-opacity-output", "font-size-output", "hitbox-size-output",
      "line-opacity-output", "visibility-edit-button", "visibility-editor-status", "visibility-editor-panel", "visibility-target-select",
      "visibility-search-input", "visibility-show-all-button", "visibility-hide-all-button", "visibility-invert-button",
      "visibility-summary", "electrode-visibility-list", "loading-overlay", "eeg-plot", "selected-coordinate-strip",
      "selected-coordinate-label", "selected-coordinate-frame", "selected-coordinate-value", "selected-mni-coordinate-value",
      "selected-mni-coordinate-method", "selected-cap-pill", "selected-electrode-content",
      "matched-count", "mean-distance", "max-distance", "comparison-table-wrap"
    ];
    ids.forEach((id) => { dom[id] = byId(id); });
  }

  function canonicalLabel(value) {
    const raw = String(value ?? "").trim().replace(/[ _]/g, "");
    if (!raw) return "";
    if (/^fp/i.test(raw)) return `Fp${raw.slice(2).replace(/z$/i, "z").replace(/h$/i, "h")}`;
    for (const prefix of ["AF", "FT", "FC", "TP", "CP", "PO"]) {
      if (raw.toUpperCase().startsWith(prefix)) {
        return `${prefix}${raw.slice(prefix.length).replace(/z$/i, "z").replace(/h$/i, "h")}`;
      }
    }
    return `${raw.charAt(0).toUpperCase()}${raw.slice(1).replace(/z$/i, "z").replace(/h$/i, "h")}`;
  }

  function labelKey(value) {
    return String(value ?? "").trim().replace(/[\s_]/g, "").replace(/[\u2032\u2018\u2019]/g, "\'").replace(/\u2033/g, "\'\'").toLowerCase();
  }

  function labelPrefix(label) {
    const match = canonicalLabel(label).match(/^([A-Za-z]+)/);
    return match ? match[1] : "";
  }

  function labelNumber(label) {
    const match = canonicalLabel(label).match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function isInternationalStyleLabel(label) {
    const lab = canonicalLabel(label);
    return /^(?:(?:Fp|AFp|AF|AFF|F|FFC|FFT|FT|FTT|FC|FCC|C|TTP|T|TP|TPP|CCP|CP|CPP|P|PPO|PO|POO|O|OI|I)\d*(?:z|h|'+)*|[AM]\d+)$/i.test(lab);
  }

  function denseRowFamily(label) {
    const upper = canonicalLabel(label).toUpperCase().replace(/'/g, "");
    const families = ["AFP", "AFF", "FFC", "FFT", "FTT", "FCC", "TTP", "CCP", "CPP", "TPP", "PPO", "POO", "OI"];
    return families.find((family) => upper.startsWith(family)) || "";
  }

  function inferHemisphere(label, x) {
    const lab = canonicalLabel(label);
    if (/z$/i.test(lab)) return "midline";
    const number = labelNumber(lab);
    if (number !== null && isInternationalStyleLabel(lab)) {
      return number % 2 === 1 ? "left hemisphere" : "right hemisphere";
    }
    if (Number.isFinite(x)) {
      if (x < -3) return "left hemisphere";
      if (x > 3) return "right hemisphere";
    }
    return "uncertain hemisphere";
  }

  function coordinateBasedCategory(electrode) {
    const anatomical = anatomicalCoordinate(electrode);
    const x = Number(anatomical.x); const y = Number(anatomical.y); const z = Number(anatomical.z);
    const absX = Math.abs(x);
    if (![x, y, z].every(Number.isFinite)) return "generic";
    if (z < -34) return "inferior_edge";
    if (y > 62) return "frontopolar";
    if (y > 28) {
      if (absX < 26 && z > 48) return "medial_frontal";
      if (absX > 58 && z < 28) return "inferior_frontal";
      return "dlpfc";
    }
    if (y > 2) {
      if (absX > 66 && z < 28) return "auditory_temporal";
      return z > 48 ? "premotor" : "inferior_frontal";
    }
    if (y > -28) {
      if (absX > 68 && z < 30) return "auditory_temporal";
      return "sensorimotor";
    }
    if (y > -62) {
      if (absX > 66 && z < 34) return "temporoparietal";
      if (absX < 28 && z > 55) return "medial_parietal";
      return "somatosensory_parietal";
    }
    if (y > -92) {
      if (absX > 62 && z < 25) return "temporoparietal";
      return z > 35 ? "posterior_parietal" : "parieto_occipital";
    }
    return "occipital_visual";
  }

  function categoryFromLabel(electrode) {
    const lab = canonicalLabel(electrode.label);
    const override = REGION_OVERRIDES[lab];
    if (override?.category) return override.category;

    const denseFamily = denseRowFamily(lab);
    const denseCategories = {
      AFP: "frontopolar",
      AFF: "dlpfc",
      FFC: "premotor",
      FFT: "inferior_frontal",
      FTT: "inferior_frontal",
      FCC: "premotor",
      TTP: "auditory_temporal",
      CCP: "sensorimotor",
      CPP: "somatosensory_parietal",
      TPP: "temporoparietal",
      PPO: "posterior_parietal",
      POO: "parieto_occipital",
      OI: "occipital_visual"
    };
    if (denseCategories[denseFamily]) return denseCategories[denseFamily];

    const prefix = labelPrefix(lab);
    const number = labelNumber(lab);
    const lateral = Number.isFinite(number) ? number : 0;
    if (prefix === "Fp" || prefix.startsWith("AFp") || prefix === "AF") return "frontopolar";
    if (prefix === "F") {
      if (/z$/i.test(lab) || [1, 2].includes(number)) return "medial_frontal";
      if ([3, 4, 5, 6].includes(number)) return "dlpfc";
      return lateral >= 7 ? "inferior_frontal" : "dlpfc";
    }
    if (prefix === "FC") {
      if (/z$/i.test(lab) || [1, 2].includes(number)) return "medial_frontal";
      return "premotor";
    }
    if (prefix === "C") return "sensorimotor";
    if (prefix === "CP") {
      if (/z$/i.test(lab) || [1, 2].includes(number)) return "medial_parietal";
      return lateral >= 5 ? "temporoparietal" : "somatosensory_parietal";
    }
    if (prefix === "P") {
      if (/z$/i.test(lab) || [1, 2].includes(number)) return "medial_parietal";
      return lateral >= 7 ? "temporoparietal" : "posterior_parietal";
    }
    if (prefix === "PO") return "parieto_occipital";
    if (prefix === "O" || prefix === "I") return "occipital_visual";
    if (prefix === "FT") return "inferior_frontal";
    if (prefix === "TP") return "temporoparietal";
    if (prefix === "T") return Number.isFinite(number) && number >= 9 ? "inferior_edge" : "auditory_temporal";
    return coordinateBasedCategory(electrode);
  }

  function inferScalpLocation(electrode) {
    const lab = canonicalLabel(electrode.label);
    const override = REGION_OVERRIDES[lab];
    if (override?.scalp) return override.scalp;
    const anatomical = anatomicalCoordinate(electrode);
    const hemisphere = inferHemisphere(lab, anatomical.x).replace(" hemisphere", "");
    const prefix = labelPrefix(lab);
    const denseFamily = denseRowFamily(lab);
    const rowName = ({
      AFP: "frontopolar/anterior-frontal", AFF: "anterior-frontal/frontal", FFC: "frontal/frontocentral",
      FFT: "frontal/frontotemporal", FTT: "frontotemporal/temporal", FCC: "frontocentral/central",
      TTP: "temporal/temporoparietal", CCP: "central/centroparietal", CPP: "centroparietal/parietal",
      TPP: "temporoparietal/parietal", PPO: "parietal/parieto-occipital", POO: "parieto-occipital/occipital",
      OI: "occipital/inferior"
    })[denseFamily] || ({
      Fp: "frontopolar", AF: "anterior frontal", F: "frontal", FT: "frontotemporal",
      FC: "frontocentral", C: "central", CP: "centroparietal", T: "temporal",
      TP: "temporoparietal", P: "parietal", PO: "parieto-occipital", O: "occipital", I: "inferior occipital"
    })[prefix];
    if (rowName) return `${hemisphere === "midline" ? "Midline" : hemisphere.charAt(0).toUpperCase() + hemisphere.slice(1)} ${rowName} scalp`;
    const anteriorPosterior = anatomical.y > 35 ? "anterior" : anatomical.y < -45 ? "posterior" : "central";
    const lateral = Math.abs(anatomical.x) > 55 ? "lateral" : Math.abs(anatomical.x) < 18 ? "midline" : "intermediate";
    return `${hemisphere === "midline" ? "Midline" : hemisphere.charAt(0).toUpperCase() + hemisphere.slice(1)} ${anteriorPosterior} ${lateral} scalp`;
  }

  function inferElectrodeInfo(electrode) {
    const category = categoryFromLabel(electrode);
    const library = REGION_LIBRARY[category] || REGION_LIBRARY.generic || {};
    const suppliedRegion = String(electrode.region || "").trim();
    const suppliedFunction = String(electrode.functionText || "").trim();
    const suppliedUrl = String(electrode.regionUrl || "").trim();
    const knownInternationalLabel = Boolean(REGION_OVERRIDES[canonicalLabel(electrode.label)]) || isInternationalStyleLabel(electrode.label);
    const inferredSource = knownInternationalLabel
      ? "Broad label-based international scalp-position rule informed by published 10–20/10–10 scalp-to-cortex correspondence studies"
      : "Broad coordinate-based anterior/posterior and medial/lateral rule; no cap-specific cortical atlas lookup was performed";
    const libraryReferences = Array.isArray(library.references) ? library.references : [];
    const suppliedReference = suppliedUrl
      ? [{ label: "Source supplied in uploaded CSV", url: suppliedUrl, type: "user-supplied reference" }]
      : [];
    return {
      category,
      scalp: inferScalpLocation(electrode),
      region: suppliedRegion || library.region || "Approximate superficial cortical territory",
      functions: suppliedFunction || library.functions || "No reliable functional summary is available for this coordinate.",
      source: suppliedRegion
        ? "Region supplied in the uploaded CSV"
        : library.mappingBasis || inferredSource,
      confidence: suppliedRegion
        ? "As specified by the uploaded file; the viewer has not independently validated this assignment"
        : library.confidence || (knownInternationalLabel
          ? "Approximate; moderate for a template head and lower for an individual"
          : "Approximate; low for a nonstandard or numbered cap label"),
      evidenceLevel: suppliedRegion
        ? "User-supplied anatomical description"
        : library.evidenceLevel || (knownInternationalLabel ? "International-label estimate" : "Coordinate-based estimate"),
      sourceLabel: suppliedUrl ? "Source supplied in CSV" : library.sourceLabel || "Scalp-to-cortex correspondence reference",
      sourceUrl: suppliedUrl || library.sourceUrl || MAPPING_REFERENCES[0]?.url || "",
      anatomyLabel: library.anatomyLabel || MAPPING_REFERENCES[1]?.label || "Additional anatomy reference",
      anatomyUrl: library.anatomyUrl || MAPPING_REFERENCES[1]?.url || "",
      references: [...suppliedReference, ...libraryReferences]
    };
  }

  function makeElectrode(row, source, index) {
    const label = canonicalLabel(row.label);
    const x = finiteNumberOrNull(row.x);
    const y = finiteNumberOrNull(row.y);
    const z = finiteNumberOrNull(row.z);
    const coordinateFrame = String(row.coordinateFrame || row.coordinate_frame || "Uploaded coordinate frame (not verified)").trim();
    const mniCompatible = row.mniCompatible === true || (row.mniCompatible !== false && coordinateFrameClaimsMni(coordinateFrame));
    const projectedX = finiteNumberOrNull(row.mniX ?? row.mni_x);
    const projectedY = finiteNumberOrNull(row.mniY ?? row.mni_y);
    const projectedZ = finiteNumberOrNull(row.mniZ ?? row.mni_z);
    return {
      label,
      x,
      y,
      z,
      region: row.region ? String(row.region).trim() : "",
      functionText: row.functionText || row.function ? String(row.functionText || row.function).trim() : "",
      regionUrl: row.regionUrl || row.region_url ? String(row.regionUrl || row.region_url).trim() : "",
      coordinateFrame,
      mniCompatible,
      providedMniX: finiteNumberOrNull(row.providedMniX),
      providedMniY: finiteNumberOrNull(row.providedMniY),
      providedMniZ: finiteNumberOrNull(row.providedMniZ),
      mniX: projectedX,
      mniY: projectedY,
      mniZ: projectedZ,
      mniPreX: finiteNumberOrNull(row.mniPreX),
      mniPreY: finiteNumberOrNull(row.mniPreY),
      mniPreZ: finiteNumberOrNull(row.mniPreZ),
      mniProjectionDistanceMm: finiteNumberOrNull(row.mniProjectionDistanceMm),
      mniProjectionKind: String(row.mniProjectionKind || ""),
      mniProjectionMethod: String(row.mniProjectionMethod || ""),
      mniProjectionBasis: String(row.mniProjectionBasis || ""),
      mniRegistrationResidualMm: finiteNumberOrNull(row.mniRegistrationResidualMm ?? row.mniRegistrationRmsResidualMm),
      mniProjectionWarning: String(row.mniProjectionWarning || ""),
      presetId: row.presetId || "",
      source,
      index,
      hemisphere: inferHemisphere(label, Number.isFinite(projectedX) ? projectedX : x)
    };
  }

  function clonePresetCoordinates(presetId, source = "reference") {
    const preset = MONTAGES[presetId];
    if (!preset || !Array.isArray(preset.electrodes)) return [];
    return preset.electrodes.map((row, index) => makeElectrode({
      ...row,
      coordinateFrame: preset.coordinateFrame,
      mniCompatible: preset.mniCompatible === true,
      mniProjectionKind: preset.mniProjectionKind,
      mniProjectionMethod: preset.mniProjectionMethod,
      mniProjectionBasis: preset.mniProjectionBasis,
      mniRegistrationResidualMm: preset.mniRegistrationRmsResidualMm,
      mniProjectionWarning: preset.mniProjectionWarning,
      presetId
    }, source, index));
  }

  function cloneDefaultCoordinates() {
    return DEFAULT_COORDS.map((row, index) => makeElectrode({
      ...row,
      coordinateFrame: DEFAULT_PRESET?.coordinateFrame || "MNI / fsaverage MRI coordinates",
      mniCompatible: DEFAULT_PRESET?.mniCompatible !== false,
      mniProjectionKind: DEFAULT_PRESET?.mniProjectionKind,
      mniProjectionMethod: DEFAULT_PRESET?.mniProjectionMethod,
      mniProjectionBasis: DEFAULT_PRESET?.mniProjectionBasis,
      mniRegistrationResidualMm: DEFAULT_PRESET?.mniRegistrationRmsResidualMm,
      mniProjectionWarning: DEFAULT_PRESET?.mniProjectionWarning,
      presetId: DEFAULT_MONTAGE_ID
    }, "reference", index));
  }

  function median(values) {
    const valid = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!valid.length) return NaN;
    const middle = Math.floor(valid.length / 2);
    return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2;
  }

  function percentile(values, p) {
    const valid = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!valid.length) return NaN;
    const position = (valid.length - 1) * p;
    const base = Math.floor(position);
    const fraction = position - base;
    return valid[base + 1] === undefined ? valid[base] : valid[base] + fraction * (valid[base + 1] - valid[base]);
  }

  function robustRange(values) {
    const low = percentile(values, 0.05);
    const high = percentile(values, 0.95);
    return Number.isFinite(low) && Number.isFinite(high) ? Math.max(high - low, 1e-6) : 1;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function finiteNumberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function coordinateFrameClaimsMni(value) {
    const frame = String(value || "").trim();
    if (!frame) return false;
    if (/\b(?:not|non)[\s-]*(?:mni|fsaverage)\b|\bnot\s+(?:verified|registered|aligned).*\bmni\b/i.test(frame)) return false;
    return /\bmni\b|fsaverage/i.test(frame);
  }

  function isFinitePoint(point) {
    return point && [point.x, point.y, point.z].every(Number.isFinite);
  }

  function sourceCoordinate(electrode) {
    return {
      x: finiteNumberOrNull(electrode.x),
      y: finiteNumberOrNull(electrode.y),
      z: finiteNumberOrNull(electrode.z)
    };
  }

  function mniCoordinate(electrode) {
    const point = {
      x: finiteNumberOrNull(electrode.mniX),
      y: finiteNumberOrNull(electrode.mniY),
      z: finiteNumberOrNull(electrode.mniZ)
    };
    return isFinitePoint(point) ? point : null;
  }

  function hasMniProjection(electrode) {
    return Boolean(mniCoordinate(electrode));
  }

  function anatomicalCoordinate(electrode) {
    return mniCoordinate(electrode) || sourceCoordinate(electrode);
  }

  function centroid(points) {
    if (!points.length) return { x: 0, y: 0, z: 0 };
    const total = points.reduce((sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + point.z
    }), { x: 0, y: 0, z: 0 });
    return { x: total.x / points.length, y: total.y / points.length, z: total.z / points.length };
  }

  function largestEigenvectorSymmetric4(matrix) {
    const a = matrix.map((row) => row.slice());
    const vectors = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => row === col ? 1 : 0));
    for (let iteration = 0; iteration < 80; iteration += 1) {
      let p = 0; let q = 1; let largest = Math.abs(a[p][q]);
      for (let row = 0; row < 4; row += 1) {
        for (let col = row + 1; col < 4; col += 1) {
          const value = Math.abs(a[row][col]);
          if (value > largest) { largest = value; p = row; q = col; }
        }
      }
      if (largest < 1e-12) break;
      const angle = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const app = a[p][p]; const aqq = a[q][q]; const apq = a[p][q];
      for (let index = 0; index < 4; index += 1) {
        if (index === p || index === q) continue;
        const aip = a[index][p]; const aiq = a[index][q];
        a[index][p] = a[p][index] = cosine * aip - sine * aiq;
        a[index][q] = a[q][index] = sine * aip + cosine * aiq;
      }
      a[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
      a[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
      a[p][q] = a[q][p] = 0;
      for (let row = 0; row < 4; row += 1) {
        const vip = vectors[row][p]; const viq = vectors[row][q];
        vectors[row][p] = cosine * vip - sine * viq;
        vectors[row][q] = sine * vip + cosine * viq;
      }
    }
    let best = 0;
    for (let index = 1; index < 4; index += 1) if (a[index][index] > a[best][best]) best = index;
    const vector = vectors.map((row) => row[best]);
    const length = Math.hypot(...vector) || 1;
    return vector.map((value) => value / length);
  }

  function quaternionRotationMatrix(quaternion) {
    const [w, x, y, z] = quaternion;
    return [
      [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]
    ];
  }

  function rotatePoint(point, rotation) {
    return {
      x: rotation[0][0] * point.x + rotation[0][1] * point.y + rotation[0][2] * point.z,
      y: rotation[1][0] * point.x + rotation[1][1] * point.y + rotation[1][2] * point.z,
      z: rotation[2][0] * point.x + rotation[2][1] * point.y + rotation[2][2] * point.z
    };
  }

  function fitSimilarityTransform(sourcePoints, targetPoints) {
    if (!Array.isArray(sourcePoints) || sourcePoints.length < 3 || sourcePoints.length !== targetPoints.length) return null;
    const sourceCenter = centroid(sourcePoints);
    const targetCenter = centroid(targetPoints);
    const source = sourcePoints.map((point) => ({ x: point.x - sourceCenter.x, y: point.y - sourceCenter.y, z: point.z - sourceCenter.z }));
    const target = targetPoints.map((point) => ({ x: point.x - targetCenter.x, y: point.y - targetCenter.y, z: point.z - targetCenter.z }));
    const covariance = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    source.forEach((point, index) => {
      const other = target[index];
      const a = [point.x, point.y, point.z];
      const b = [other.x, other.y, other.z];
      for (let row = 0; row < 3; row += 1) for (let col = 0; col < 3; col += 1) covariance[row][col] += a[row] * b[col];
    });
    const [[sxx, sxy, sxz], [syx, syy, syz], [szx, szy, szz]] = covariance;
    const trace = sxx + syy + szz;
    const horn = [
      [trace, syz - szy, szx - sxz, sxy - syx],
      [syz - szy, sxx - syy - szz, sxy + syx, szx + sxz],
      [szx - sxz, sxy + syx, -sxx + syy - szz, syz + szy],
      [sxy - syx, szx + sxz, syz + szy, -sxx - syy + szz]
    ];
    const rotation = quaternionRotationMatrix(largestEigenvectorSymmetric4(horn));
    let numerator = 0; let denominator = 0;
    source.forEach((point, index) => {
      const rotated = rotatePoint(point, rotation);
      numerator += target[index].x * rotated.x + target[index].y * rotated.y + target[index].z * rotated.z;
      denominator += point.x * point.x + point.y * point.y + point.z * point.z;
    });
    if (denominator < 1e-9) return null;
    const scale = numerator / denominator;
    if (!Number.isFinite(scale) || scale <= 0) return null;
    const rotatedCenter = rotatePoint(sourceCenter, rotation);
    const translation = {
      x: targetCenter.x - scale * rotatedCenter.x,
      y: targetCenter.y - scale * rotatedCenter.y,
      z: targetCenter.z - scale * rotatedCenter.z
    };
    const transform = { scale, rotation, translation };
    const residuals = sourcePoints.map((point, index) => {
      const mapped = applySimilarityTransform(point, transform);
      const targetPoint = targetPoints[index];
      return Math.hypot(mapped.x - targetPoint.x, mapped.y - targetPoint.y, mapped.z - targetPoint.z);
    });
    transform.rmsResidual = Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length);
    transform.medianResidual = median(residuals);
    return transform;
  }

  function applySimilarityTransform(point, transform) {
    const rotated = rotatePoint(point, transform.rotation);
    return {
      x: transform.scale * rotated.x + transform.translation.x,
      y: transform.scale * rotated.y + transform.translation.y,
      z: transform.scale * rotated.z + transform.translation.z
    };
  }

  function projectToTemplateScalp(point) {
    if (!isFinitePoint(point) || !TEMPLATE_MESH || !Array.isArray(TEMPLATE_MESH.x)) return null;
    let bestIndex = -1; let bestSquaredDistance = Infinity;
    for (let index = 0; index < TEMPLATE_MESH.x.length; index += 1) {
      const dx = point.x - TEMPLATE_MESH.x[index];
      const dy = point.y - TEMPLATE_MESH.y[index];
      const dz = point.z - TEMPLATE_MESH.z[index];
      const squared = dx * dx + dy * dy + dz * dz;
      if (squared < bestSquaredDistance) { bestSquaredDistance = squared; bestIndex = index; }
    }
    if (bestIndex < 0) return null;
    return {
      x: TEMPLATE_MESH.x[bestIndex],
      y: TEMPLATE_MESH.y[bestIndex],
      z: TEMPLATE_MESH.z[bestIndex],
      distance: Math.sqrt(bestSquaredDistance),
      vertexIndex: bestIndex
    };
  }

  function setMniProjection(electrode, preProjectionPoint, metadata = {}) {
    const projected = projectToTemplateScalp(preProjectionPoint);
    if (!projected) return false;
    electrode.mniPreX = preProjectionPoint.x;
    electrode.mniPreY = preProjectionPoint.y;
    electrode.mniPreZ = preProjectionPoint.z;
    electrode.mniX = projected.x;
    electrode.mniY = projected.y;
    electrode.mniZ = projected.z;
    electrode.mniProjectionDistanceMm = projected.distance;
    electrode.mniProjectionKind = metadata.kind || "template_surface_estimate";
    electrode.mniProjectionMethod = metadata.method || "Estimated coordinate projected to the nearest bundled fsaverage scalp vertex.";
    electrode.mniProjectionBasis = metadata.basis || "template registration";
    electrode.mniRegistrationResidualMm = Number.isFinite(metadata.residual) ? metadata.residual : null;
    electrode.mniProjectionWarning = metadata.warning || "Template-based estimate; not subject-specific MRI coregistration.";
    return true;
  }

  function fiducialKey(label, pointType = "") {
    const normalizedLabel = String(label || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedType = String(pointType || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const candidates = [normalizedLabel, normalizedType, `${normalizedLabel}${normalizedType}`, `${normalizedType}${normalizedLabel}`];
    if (candidates.some((value) => ["nas", "nz", "nasion", "nasionpoint", "fiducialnas", "fiducialnasion", "nasfiducial", "nasionfiducial"].includes(value))) return "nasion";
    if (candidates.some((value) => ["lpa", "leftpreauricular", "leftpreauricularpoint", "fiduciallpa", "lpafiducial"].includes(value))) return "lpa";
    if (candidates.some((value) => ["rpa", "rightpreauricular", "rightpreauricularpoint", "fiducialrpa", "rpafiducial"].includes(value))) return "rpa";
    return "";
  }

  function canonicalMniMap() {
    const map = new Map();
    (CANONICAL_MNI_PRESET?.electrodes || []).forEach((row) => map.set(labelKey(row.label), { x: Number(row.x), y: Number(row.y), z: Number(row.z), label: row.label }));
    return map;
  }

  function assignMniProjections(electrodes, options = {}) {
    const unresolved = [];
    const pairedSource = [];
    const pairedMni = [];
    electrodes.forEach((electrode) => {
      if (hasMniProjection(electrode)) return;
      const supplied = {
        x: finiteNumberOrNull(electrode.providedMniX),
        y: finiteNumberOrNull(electrode.providedMniY),
        z: finiteNumberOrNull(electrode.providedMniZ)
      };
      if (isFinitePoint(supplied)) {
        setMniProjection(electrode, supplied, {
          kind: "csv_supplied_mni_surface_projection",
          method: "CSV-supplied MNI coordinate projected to the nearest bundled fsaverage scalp vertex.",
          basis: "mni_x, mni_y, and mni_z columns supplied in the CSV",
          warning: "The MNI coordinate was declared by the CSV; the viewer does not independently verify its registration."
        });
        pairedSource.push(sourceCoordinate(electrode));
        pairedMni.push(supplied);
      } else if (electrode.mniCompatible) {
        setMniProjection(electrode, sourceCoordinate(electrode), {
          kind: "native_mni_surface_projection",
          method: "Source coordinate is declared MNI/fsaverage-compatible and was projected to the nearest bundled fsaverage scalp vertex.",
          basis: electrode.coordinateFrame || "MNI/fsaverage source coordinate",
          warning: "The source coordinate frame was declared by the preset or CSV; the viewer does not independently verify custom-file registration."
        });
      } else {
        unresolved.push(electrode);
      }
    });
    if (!unresolved.length) return { available: electrodes.length, unavailable: 0, method: "direct or CSV-supplied MNI" };

    let transform = null;
    let kind = "";
    let method = "";
    let basis = "";
    let warning = "Template-based estimate; not subject-specific MRI coregistration.";

    if (pairedSource.length >= 3) {
      transform = fitSimilarityTransform(pairedSource, pairedMni);
      kind = "csv_pair_registered_surface_estimate";
      method = `Similarity registration using ${pairedSource.length} rows containing both source and MNI coordinates, followed by nearest-vertex projection to the bundled fsaverage scalp.`;
      basis = `${pairedSource.length} source-to-MNI coordinate pairs from the CSV`;
    }

    const fiducials = options.fiducials || {};
    if (!transform && ["nasion", "lpa", "rpa"].every((key) => isFinitePoint(fiducials[key]))) {
      transform = fitSimilarityTransform(
        [fiducials.nasion, fiducials.lpa, fiducials.rpa],
        [TEMPLATE_MNI_FIDUCIALS.nasion, TEMPLATE_MNI_FIDUCIALS.lpa, TEMPLATE_MNI_FIDUCIALS.rpa]
      );
      kind = "fiducial_registered_surface_estimate";
      method = "Similarity registration from CSV nasion/LPA/RPA fiducials to fsaverage fiducials, followed by nearest-vertex projection to the bundled fsaverage scalp.";
      basis = "nasion, LPA, and RPA supplied in the CSV";
    }

    if (!transform) {
      const targetMap = canonicalMniMap();
      const matches = electrodes
        .map((electrode) => ({ electrode, target: targetMap.get(labelKey(electrode.label)) }))
        .filter((item) => item.target && isFinitePoint(sourceCoordinate(item.electrode)));
      if (matches.length >= 4 && matches.length / Math.max(electrodes.length, 1) >= 0.5) {
        transform = fitSimilarityTransform(matches.map((item) => sourceCoordinate(item.electrode)), matches.map((item) => item.target));
        kind = "label_registered_surface_estimate";
        method = `Similarity registration to MNE standard_1005 using ${matches.length} matching electrode labels, followed by nearest-vertex projection to the bundled fsaverage scalp.`;
        basis = `${matches.length} matching international electrode labels`;
      }
    }

    if (transform) {
      unresolved.forEach((electrode) => {
        setMniProjection(electrode, applySimilarityTransform(sourceCoordinate(electrode), transform), {
          kind, method, basis, residual: transform.rmsResidual, warning
        });
      });
    } else {
      unresolved.forEach((electrode) => {
        electrode.mniProjectionKind = "unavailable";
        electrode.mniProjectionMethod = "MNI projection unavailable: supply mni_x/mni_y/mni_z, NAS/LPA/RPA fiducials, or enough standard electrode labels for template registration.";
        electrode.mniProjectionBasis = "insufficient registration information";
        electrode.mniProjectionWarning = "A display-only head fit is not sufficient to establish an MNI coordinate transform.";
      });
    }
    const available = electrodes.filter(hasMniProjection).length;
    return { available, unavailable: electrodes.length - available, method: transform ? method : "unavailable" };
  }

  function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const normalized = String(text).replace(/^\uFEFF/, "");
    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized[index];
      if (char === '"') {
        if (quoted && normalized[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && normalized[index + 1] === "\n") index += 1;
        row.push(cell.trim());
        cell = "";
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
      } else {
        cell += char;
      }
    }
    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
    return rows;
  }

  function detectDelimiter(text) {
    const firstLine = String(text).split(/\r?\n/, 1)[0] || "";
    const candidates = [",", "\t", ";"];
    let best = ",";
    let bestCount = -1;
    candidates.forEach((candidate) => {
      const count = firstLine.split(candidate).length - 1;
      if (count > bestCount) {
        best = candidate;
        bestCount = count;
      }
    });
    return best;
  }

  function normalizeHeader(value) {
    return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  }

  function findHeaderIndex(headers, aliases) {
    for (const alias of aliases) {
      const index = headers.indexOf(alias);
      if (index >= 0) return index;
    }
    return -1;
  }

  function parseElectrodeCSV(text, unitsMode, source) {
    const rows = parseDelimited(text, detectDelimiter(text));
    if (rows.length < 2) throw new Error("The CSV does not contain a header and at least one data row.");
    const headers = rows[0].map(normalizeHeader);
    const labelIndex = findHeaderIndex(headers, ["label", "electrode", "electrode_label", "channel", "channel_name", "name", "ch_name"]);
    const sourceXIndex = findHeaderIndex(headers, ["x", "source_x", "x_mm", "coord_x", "coordinate_x"]);
    const sourceYIndex = findHeaderIndex(headers, ["y", "source_y", "y_mm", "coord_y", "coordinate_y"]);
    const sourceZIndex = findHeaderIndex(headers, ["z", "source_z", "z_mm", "coord_z", "coordinate_z"]);
    const mniXIndex = findHeaderIndex(headers, ["mni_x", "mni_x_mm", "template_mni_x", "projected_mni_x"]);
    const mniYIndex = findHeaderIndex(headers, ["mni_y", "mni_y_mm", "template_mni_y", "projected_mni_y"]);
    const mniZIndex = findHeaderIndex(headers, ["mni_z", "mni_z_mm", "template_mni_z", "projected_mni_z"]);
    const hasSourceTriplet = [sourceXIndex, sourceYIndex, sourceZIndex].every((index) => index >= 0);
    const hasMniTriplet = [mniXIndex, mniYIndex, mniZIndex].every((index) => index >= 0);
    const sourceUsesMniHeaders = !hasSourceTriplet && hasMniTriplet;
    const xIndex = hasSourceTriplet ? sourceXIndex : mniXIndex;
    const yIndex = hasSourceTriplet ? sourceYIndex : mniYIndex;
    const zIndex = hasSourceTriplet ? sourceZIndex : mniZIndex;
    const regionIndex = findHeaderIndex(headers, ["region", "brain_region", "cortical_region", "area"]);
    const functionIndex = findHeaderIndex(headers, ["function", "functions", "functional_summary", "cortical_function"]);
    const regionUrlIndex = findHeaderIndex(headers, ["region_url", "region_link", "source_url", "reference_url"]);
    const coordinateFrameIndex = findHeaderIndex(headers, ["coordinate_frame", "coordinate_system", "space", "coordsystem"]);
    const pointTypeIndex = findHeaderIndex(headers, ["point_type", "type", "kind", "role"]);
    if (labelIndex < 0 || [xIndex, yIndex, zIndex].some((index) => index < 0)) {
      throw new Error("Required columns were not found. Use label,x,y,z or label,mni_x,mni_y,mni_z.");
    }

    const parsed = [];
    const rawFiducials = {};
    rows.slice(1).forEach((row) => {
      const rawLabel = String(row[labelIndex] || "").trim();
      const pointType = pointTypeIndex >= 0 ? String(row[pointTypeIndex] || "").trim() : "";
      const x = finiteNumberOrNull(row[xIndex]);
      const y = finiteNumberOrNull(row[yIndex]);
      const z = finiteNumberOrNull(row[zIndex]);
      if (!rawLabel && !Number.isFinite(x) && !Number.isFinite(y) && !Number.isFinite(z)) return;
      if (!rawLabel || ![x, y, z].every(Number.isFinite)) return;
      const key = fiducialKey(rawLabel, pointType);
      if (key) {
        rawFiducials[key] = { x, y, z };
        return;
      }
      const label = canonicalLabel(rawLabel);
      const rowFrame = coordinateFrameIndex >= 0 ? String(row[coordinateFrameIndex] || "").trim() : "";
      const coordinateFrame = rowFrame || (sourceUsesMniHeaders
        ? "MNI coordinates (declared by CSV headers)"
        : "Uploaded source coordinate frame (not verified as MNI)");
      const explicitMni = hasSourceTriplet && hasMniTriplet
        ? {
            x: finiteNumberOrNull(row[mniXIndex]),
            y: finiteNumberOrNull(row[mniYIndex]),
            z: finiteNumberOrNull(row[mniZIndex])
          }
        : null;
      parsed.push({
        label, x, y, z,
        region: regionIndex >= 0 ? row[regionIndex] : "",
        functionText: functionIndex >= 0 ? row[functionIndex] : "",
        regionUrl: regionUrlIndex >= 0 ? row[regionUrlIndex] : "",
        coordinateFrame,
        mniCompatible: sourceUsesMniHeaders || coordinateFrameClaimsMni(coordinateFrame),
        providedMniX: explicitMni && isFinitePoint(explicitMni) ? explicitMni.x : null,
        providedMniY: explicitMni && isFinitePoint(explicitMni) ? explicitMni.y : null,
        providedMniZ: explicitMni && isFinitePoint(explicitMni) ? explicitMni.z : null
      });
    });
    if (!parsed.length) throw new Error("No valid electrode rows were found. Fiducials alone are not sufficient.");

    let multiplier = 1;
    let detectedUnits = unitsMode;
    if (unitsMode === "m") multiplier = 1000;
    else if (unitsMode === "auto") {
      const magnitudes = parsed.flatMap((row) => [Math.abs(row.x), Math.abs(row.y), Math.abs(row.z)]);
      Object.values(rawFiducials).forEach((point) => magnitudes.push(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)));
      const high = percentile(magnitudes, 0.95);
      if (high < 2.5) {
        multiplier = 1000;
        detectedUnits = "m (auto-detected)";
      } else {
        detectedUnits = "mm (auto-detected)";
      }
    }

    const fiducials = {};
    Object.entries(rawFiducials).forEach(([key, point]) => {
      fiducials[key] = { x: point.x * multiplier, y: point.y * multiplier, z: point.z * multiplier };
    });

    const seen = new Set();
    const electrodes = [];
    let duplicateCount = 0;
    parsed.forEach((row, index) => {
      const key = labelKey(row.label);
      if (seen.has(key)) {
        duplicateCount += 1;
        return;
      }
      seen.add(key);
      electrodes.push(makeElectrode({
        ...row,
        x: row.x * multiplier,
        y: row.y * multiplier,
        z: row.z * multiplier,
        providedMniX: Number.isFinite(row.providedMniX) ? row.providedMniX * multiplier : null,
        providedMniY: Number.isFinite(row.providedMniY) ? row.providedMniY * multiplier : null,
        providedMniZ: Number.isFinite(row.providedMniZ) ? row.providedMniZ * multiplier : null
      }, source, index));
    });
    const projectionSummary = assignMniProjections(electrodes, { fiducials });
    return {
      electrodes,
      detectedUnits,
      duplicateCount,
      declaresMni: sourceUsesMniHeaders,
      fiducials,
      projectionSummary
    };
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.readAsText(file);
    });
  }

  function mapByLabel(electrodes) {
    const map = new Map();
    electrodes.forEach((e) => map.set(labelKey(e.label), e));
    return map;
  }

  function computeComparison(reference, comparison) {
    const comparisonMap = mapByLabel(comparison);
    const rows = [];
    reference.forEach((ref) => {
      const cmp = comparisonMap.get(labelKey(ref.label));
      if (!cmp) return;
      const dx = cmp.x - ref.x;
      const dy = cmp.y - ref.y;
      const dz = cmp.z - ref.z;
      const distance = Math.hypot(dx, dy, dz);
      const referenceMni = mniCoordinate(ref);
      const comparisonMni = mniCoordinate(cmp);
      const mniDx = referenceMni && comparisonMni ? comparisonMni.x - referenceMni.x : null;
      const mniDy = referenceMni && comparisonMni ? comparisonMni.y - referenceMni.y : null;
      const mniDz = referenceMni && comparisonMni ? comparisonMni.z - referenceMni.z : null;
      const mniDistance = [mniDx, mniDy, mniDz].every(Number.isFinite) ? Math.hypot(mniDx, mniDy, mniDz) : null;
      const framesEquivalent = sourceFramesComparable(ref, cmp);
      rows.push({
        label: ref.label, reference: ref, comparison: cmp,
        dx, dy, dz, distance,
        mniDx, mniDy, mniDz, mniDistance,
        framesEquivalent
      });
    });
    rows.sort((a, b) => b.distance - a.distance);
    return rows;
  }

  function comparisonMapByLabel(rows) {
    const map = new Map();
    rows.forEach((row) => map.set(labelKey(row.label), row));
    return map;
  }

  function montageGroups() {
    const groups = new Map();
    Object.entries(MONTAGES).forEach(([id, preset]) => {
      const group = preset.group || "Other templates";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push([id, preset]);
    });
    return groups;
  }

  function projectionAvailabilityText(electrodes) {
    const available = electrodes.filter(hasMniProjection).length;
    if (!electrodes.length) return "No electrodes loaded.";
    if (!available) return "Template MNI/fsaverage projection unavailable.";
    return `${available}/${electrodes.length} electrodes have a template MNI/fsaverage scalp coordinate.`;
  }

  function presetProjectionDescription(preset) {
    if (!preset) return "";
    if (preset.mniCompatible === true) {
      return "The source coordinates are already in MNI/fsaverage-compatible MRI space. The second readout is the corresponding nearest point on the bundled fsaverage scalp surface.";
    }
    if (preset.mniProjectionAvailable !== false && preset.mniProjectionMethod) {
      const residual = Number.isFinite(preset.mniRegistrationRmsResidualMm)
        ? ` Registration RMS residual: ${Number(preset.mniRegistrationRmsResidualMm).toFixed(2)} mm.`
        : "";
      return `The source coordinates are not native MNI. A separate visualization-oriented template MNI/fsaverage estimate is provided using ${preset.mniProjectionBasis || "template registration"}.${residual}`;
    }
    return "The source coordinates are not assumed to be MNI, and no template-MNI projection is available for this preset.";
  }

  function updateMontageDescription() {
    const preset = MONTAGES[state.referencePresetId];
    if (!preset) {
      const frame = state.reference[0]?.coordinateFrame || "Coordinate frame not supplied";
      dom["montage-description"].innerHTML = `<strong>Custom CSV loaded.</strong><br><span>Source frame: ${escapeHtml(frame)}. ${escapeHtml(projectionAvailabilityText(state.reference))} Original CSV coordinates are always preserved.</span>`;
      return;
    }
    const sourceUrl = safeExternalUrl(preset.sourceUrl);
    const source = sourceUrl
      ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(preset.sourceName || "Source")}</a>`
      : escapeHtml(preset.sourceName || "Built-in preset");
    dom["montage-description"].innerHTML = `<strong>${escapeHtml(preset.label)}</strong> · ${preset.electrodes.length} positions<br>${escapeHtml(preset.description || "")}<br><span>Source frame: ${escapeHtml(preset.coordinateFrame || "Template coordinates")} · ${source}</span><br><span>${escapeHtml(presetProjectionDescription(preset))}</span>`;
  }

  function populateMontageSelector() {
    dom["montage-select"].innerHTML = "";
    montageGroups().forEach((entries, group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group;
      entries.forEach(([id, preset]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = preset.label;
        optgroup.appendChild(option);
      });
      dom["montage-select"].appendChild(optgroup);
    });
    const custom = document.createElement("option");
    custom.value = "custom";
    custom.textContent = "Custom uploaded CSV";
    custom.disabled = true;
    dom["montage-select"].appendChild(custom);
    dom["montage-select"].value = MONTAGES[state.referencePresetId] ? state.referencePresetId : DEFAULT_MONTAGE_ID;
    const comparisonSelect = dom["comparison-montage-select"];
    comparisonSelect.innerHTML = '<option value="">No comparison cap</option>' + dom["montage-select"].innerHTML;
    comparisonSelect.value = state.comparisonPresetId || "";
    updateMontageDescription();
  }

  function loadMontagePreset(presetId) {
    const preset = MONTAGES[presetId];
    if (!preset) return;
    state.loadGeneration.reference += 1;
    state.reference = clonePresetCoordinates(presetId, "reference");
    state.referenceName = preset.label;
    state.referencePresetId = presetId;
    state.referenceIsDefault = true;
    state.capContext.reference = {};
    state.hidden.reference.clear();
    state.lastClicked = null;
    state.hoverPreview = null;
    dom["reference-file-input"].value = "";
    dom["montage-select"].value = presetId;
    dom["reference-status-pill"].textContent = "Built-in";
    dom["reference-status-pill"].className = "status-pill ready";
    setFileStatus("reference", `${state.reference.length} built-in electrodes loaded. Source frame: ${preset.coordinateFrame || "template coordinates"}. ${projectionAvailabilityText(state.reference)}`);
    updateMontageDescription();
    resetFitForData("reference");
    renderVisibilityList();
    scheduleRender(0);
  }

  function capElectrodes(cap) {
    return cap === "comparison" ? state.comparison : state.reference;
  }

  function selectedVisibilityCaps() {
    const target = dom["visibility-target-select"].value;
    if (target === "both") return ["reference", "comparison"].filter((cap) => capElectrodes(cap).length);
    return capElectrodes(target).length ? [target] : [];
  }

  function isElectrodeVisible(cap, electrodeOrLabel) {
    const label = typeof electrodeOrLabel === "string" ? electrodeOrLabel : electrodeOrLabel.label;
    return !state.hidden[cap].has(labelKey(label));
  }

  function visibleElectrodes(cap) {
    return capElectrodes(cap).filter((electrode) => isElectrodeVisible(cap, electrode));
  }

  function pruneHidden(cap) {
    const valid = new Set(capElectrodes(cap).map((electrode) => labelKey(electrode.label)));
    Array.from(state.hidden[cap]).forEach((key) => { if (!valid.has(key)) state.hidden[cap].delete(key); });
  }

  function updateVisibilitySummary() {
    const parts = [];
    ["reference", "comparison"].forEach((cap) => {
      const all = capElectrodes(cap);
      if (!all.length) return;
      const visible = all.filter((electrode) => isElectrodeVisible(cap, electrode)).length;
      parts.push(`${cap === "reference" ? "Reference" : "Comparison"}: ${visible}/${all.length} visible`);
    });
    dom["visibility-summary"].textContent = parts.length ? parts.join(" · ") : "No electrodes loaded.";
    dom["visibility-editor-status"].textContent = state.visibilityEditMode
      ? "Visibility editor active: use the checklist, or click a visible electrode in the 3D view to hide it. Hidden electrodes can be restored below."
      : "Activate the editor to open the electrode checklist. While it is active, clicking a visible electrode in the 3D view hides it.";
  }

  function setVisibilityEditMode(active) {
    state.visibilityEditMode = Boolean(active);
    dom["visibility-edit-button"].classList.toggle("active", state.visibilityEditMode);
    dom["visibility-edit-button"].setAttribute("aria-pressed", String(state.visibilityEditMode));
    dom["visibility-edit-button"].textContent = `Edit electrode visibility: ${state.visibilityEditMode ? "On" : "Off"}`;
    dom["visibility-editor-panel"].hidden = !state.visibilityEditMode;
    if (state.visibilityEditMode) renderVisibilityList();
    updateVisibilitySummary();
  }

  function setVisibilityForLabel(label, visible, caps) {
    const key = labelKey(label);
    caps.forEach((cap) => {
      if (visible) state.hidden[cap].delete(key);
      else state.hidden[cap].add(key);
    });
  }

  function renderVisibilityList() {
    pruneHidden("reference");
    pruneHidden("comparison");
    const caps = selectedVisibilityCaps();
    const search = String(dom["visibility-search-input"].value || "").trim().toLowerCase();
    const labels = new Map();
    caps.forEach((cap) => {
      capElectrodes(cap).forEach((electrode) => {
        const key = labelKey(electrode.label);
        if (!labels.has(key)) labels.set(key, { label: electrode.label, caps: [] });
        labels.get(key).caps.push(cap);
      });
    });
    const entries = Array.from(labels.values())
      .filter((entry) => !search || entry.label.toLowerCase().includes(search))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }));
    dom["electrode-visibility-list"].innerHTML = "";
    if (!entries.length) {
      dom["electrode-visibility-list"].innerHTML = `<div class="visibility-empty">${caps.length ? "No electrode labels match the search." : "Load the selected cap before editing visibility."}</div>`;
      updateVisibilitySummary();
      return;
    }
    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => {
      const row = document.createElement("label");
      row.className = "visibility-electrode-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const visibleCount = entry.caps.filter((cap) => isElectrodeVisible(cap, entry.label)).length;
      checkbox.checked = visibleCount === entry.caps.length;
      checkbox.indeterminate = visibleCount > 0 && visibleCount < entry.caps.length;
      checkbox.addEventListener("change", () => {
        setVisibilityForLabel(entry.label, checkbox.checked, entry.caps);
        renderVisibilityList();
        scheduleRender(0);
      });
      const label = document.createElement("span");
      label.className = "visibility-electrode-label";
      label.textContent = entry.label;
      const capTags = document.createElement("span");
      capTags.className = "visibility-cap-tags";
      capTags.textContent = entry.caps.map((cap) => cap === "reference" ? "R" : "C").join("/");
      row.append(checkbox, label, capTags);
      fragment.appendChild(row);
    });
    dom["electrode-visibility-list"].appendChild(fragment);
    updateVisibilitySummary();
  }

  function applyVisibilityAction(action) {
    const caps = selectedVisibilityCaps();
    caps.forEach((cap) => {
      if (action === "show") state.hidden[cap].clear();
      else if (action === "hide") capElectrodes(cap).forEach((electrode) => state.hidden[cap].add(labelKey(electrode.label)));
      else if (action === "invert") capElectrodes(cap).forEach((electrode) => {
        const key = labelKey(electrode.label);
        if (state.hidden[cap].has(key)) state.hidden[cap].delete(key);
        else state.hidden[cap].add(key);
      });
    });
    renderVisibilityList();
    scheduleRender(0);
  }

  const FITTING = window.EEGHeadFitting;
  const surfaceCache = new Map();
  let fitCache = new WeakMap();
  let displayCache = null;

  function resetFitForData(cap) {
    fitCache = new WeakMap();
    displayCache = null;
    state.dataRevision += 1;
    dom["head-scale-range"].value = "1";
    dom["auto-fit-checkbox"].checked = true;
    updateRangeOutputs();
    syncHeadControls();
  }

  function syncHeadControls() {
    const hasComparison = state.comparison.length > 0;
    dom["fit-source-select"].querySelector('option[value="comparison"]').disabled = !hasComparison;
    if (!hasComparison) dom["fit-source-select"].value = "reference";
    dom["comparison-layout-select"].querySelector('option[value="split"]').disabled = !hasComparison;
    if (!hasComparison) dom["comparison-layout-select"].value = "overlay";
    dom["comparison-alignment-select"].disabled = !hasComparison || dom["comparison-layout-select"].value === "split";
    dom["sync-cameras-checkbox"].disabled = !hasComparison || dom["comparison-layout-select"].value !== "split";
    dom["show-lines-checkbox"].disabled = dom["comparison-layout-select"].value === "split";
  }

  function getFitSurface(model) {
    if (!surfaceCache.has(model)) {
      const base = model === "phantom" ? createPhantomGeometry() : createTemplateGeometry();
      surfaceCache.set(model, FITTING.createSurface(base));
    }
    return surfaceCache.get(model);
  }

  function buildHeadGeometry(cap = "reference") {
    const controls = getControlValues(), electrodes = capElectrodes(cap);
    const key = [controls.headModel, controls.autoFit, controls.headScale].join("|");
    if (!fitCache.has(electrodes)) fitCache.set(electrodes, new Map());
    const cache = fitCache.get(electrodes);
    if (cache.has(key)) return cache.get(key);
    const surface = getFitSurface(controls.headModel);
    const fit = FITTING.fitHead(electrodes, {
      surface, canonicalMap: canonicalMniMap(),
      fiducials: state.capContext[cap]?.fiducials || {}, templateFiducials: TEMPLATE_MNI_FIDUCIALS,
      adaptive: controls.autoFit, overallScale: controls.headScale
    });
    const result = { ...surface.geometry, fit, cap,
      vertices: surface.geometry.vertices.map(vertex => FITTING.apply(vertex, fit.viewTransform)) };
    cache.set(key, result);
    return result;
  }

  function sourceFramesComparable(a, b) {
    if (!a || !b) return false;
    if (a.mniCompatible === true && b.mniCompatible === true) return true;
    if (a.presetId && b.presetId) return a.presetId === b.presetId;
    const left = String(a.coordinateFrame || "").trim().toLowerCase();
    const right = String(b.coordinateFrame || "").trim().toLowerCase();
    return Boolean(left && left === right && !/generic|unknown|not verified|not supplied|uploaded|unregistered/.test(left));
  }

  function buildDisplayGeometry(controls) {
    const key = [state.dataRevision, controls.headModel, controls.autoFit, controls.headScale,
      controls.clearance, controls.projectElectrodes, controls.fitSource, controls.comparisonLayout, controls.comparisonAlignment].join("|");
    if (displayCache?.key === key) return displayCache.value;
    const own = { reference: buildHeadGeometry("reference") };
    if (state.comparison.length) own.comparison = buildHeadGeometry("comparison");
    const anchorCap = controls.fitSource === "comparison" && own.comparison ? "comparison" : "reference";
    const anchor = own[anchorCap];
    const split = controls.comparisonLayout === "split" && Boolean(own.comparison);
    const positions = { reference: new Map(), comparison: new Map() };
    let alignment = "Source positions in the selected head's display frame.";
    let rigid = null, keepSource = true;
    if (own.comparison && !split) {
      keepSource = controls.comparisonAlignment === "source" ||
        (controls.comparisonAlignment === "auto" && sourceFramesComparable(state.reference[0], state.comparison[0]));
      if (controls.comparisonAlignment === "rigid") {
        const otherCap = anchorCap === "reference" ? "comparison" : "reference";
        const targetMap = mapByLabel(capElectrodes(anchorCap));
        const pairs = capElectrodes(otherCap).map(e => ({ e, target: targetMap.get(labelKey(e.label)) })).filter(p => p.target);
        rigid = FITTING.fitSimilarity(pairs.map(p => p.e), pairs.map(p => p.target), { allowScale: false });
        keepSource = false;
        alignment = rigid ? `Display-only rigid alignment from ${pairs.length} matched labels; size retained, global pose removed.` : "Too few non-collinear matching labels; using separate template-pose estimates.";
      } else if (keepSource) {
        alignment = "Both caps retain their source-space relationship; one shared rigid viewing transform is applied.";
      } else {
        alignment = "Separate estimated template poses align the heads for display; cap size is retained, absolute pose offsets are removed.";
      }
    }
    if (split) alignment = "Each head is fitted independently and shown upright at the same millimeter scale. Layout position is not a measured displacement.";
    const caps = own.comparison ? ["reference", "comparison"] : ["reference"];
    caps.forEach(cap => {
      const ownHead = own[cap], target = split ? ownHead : anchor;
      const scene = split && cap === "comparison" ? "scene2" : "scene";
      capElectrodes(cap).forEach(e => {
        let p;
        if (split || cap === anchorCap) p = FITTING.toView(e, ownHead.fit);
        else if (keepSource) p = FITTING.toView(e, anchor.fit);
        else if (rigid) p = FITTING.toView(FITTING.apply(e, rigid), anchor.fit);
        else {
          p = FITTING.toView(e, ownHead.fit);
          const centerDelta = FITTING.vector.mul(target.fit.surface.center, target.fit.pose.scale - ownHead.fit.pose.scale);
          p = FITTING.vector.add(p, centerDelta);
        }
        const projected = controls.projectElectrodes ? FITTING.projectViewPoint(p, target.fit, controls.clearance) : { point: p, adjustment: 0 };
        positions[cap].set(labelKey(e.label), { ...projected, rawView: p, scene, projected: controls.projectElectrodes });
      });
    });
    const heads = split ? [ { ...own.reference, scene: "scene" }, { ...own.comparison, scene: "scene2" } ] : [ { ...anchor, scene: "scene" } ];
    const statuses = caps.map(cap => {
      const h = own[cap];
      return `${cap === "reference" ? "Cap A" : "Cap B"}: ${h.fit.method}. Scale ${h.fit.pose.scale.toFixed(3)}; median unprojected scalp gap ${h.fit.medianAdjustment.toFixed(1)} mm. ${h.fit.warnings.join(" ")}`;
    });
    const warnings = caps.flatMap(cap => own[cap].fit.warnings);
    const value = { positions, heads, own, anchorCap, split, alignment, warnings };
    state.fitStatus = statuses.join("\n\n");
    state.displayGeometry = value;
    displayCache = { key, value };
    return value;
  }

  function displayCoordinate(cap, electrode) {
    return state.displayGeometry?.positions[cap]?.get(labelKey(electrode.label)) || { point: sourceCoordinate(electrode), adjustment: 0, scene: "scene", projected: false };
  }

  function loadComparisonPreset(presetId) {
    const preset = MONTAGES[presetId];
    if (!preset) return;
    state.loadGeneration.comparison += 1;
    state.comparison = clonePresetCoordinates(presetId, "comparison");
    state.comparisonPresetId = presetId;
    state.comparisonName = preset.label;
    state.capContext.comparison = {};
    state.hidden.comparison.clear();
    state.lastClicked = null; state.hoverPreview = null;
    dom["comparison-file-input"].value = "";
    dom["comparison-montage-select"].value = presetId;
    dom["comparison-status-pill"].textContent = "Built-in";
    dom["comparison-status-pill"].className = "status-pill comparison";
    setFileStatus("comparison", `${state.comparison.length} built-in electrodes loaded. ${projectionAvailabilityText(state.comparison)}`);
    resetFitForData("comparison");
    renderVisibilityList(); scheduleRender(0);
  }


  function createTemplateGeometry() {
    if (!TEMPLATE_MESH || !Array.isArray(TEMPLATE_MESH.x)) throw new Error("Template scalp asset is missing.");
    const vertices = TEMPLATE_MESH.x.map((x, index) => ({ x, y: TEMPLATE_MESH.y[index], z: TEMPLATE_MESH.z[index] }));
    return { vertices, i: TEMPLATE_MESH.i.slice(), j: TEMPLATE_MESH.j.slice(), k: TEMPLATE_MESH.k.slice(), source: "MNE-Python fsaverage scalp/head surface" };
  }

  function createPhantomGeometry() {
    const lonCount = 54;
    const latCount = 34;
    const vertices = [];
    const i = [];
    const j = [];
    const k = [];
    const center = { x: 0, y: -14, z: -22 };
    const radii = { x: 88, y: 110, z: 124 };
    for (let latIndex = 0; latIndex < latCount; latIndex += 1) {
      const lat = -Math.PI / 2 + Math.PI * latIndex / (latCount - 1);
      for (let lonIndex = 0; lonIndex < lonCount; lonIndex += 1) {
        const lon = 2 * Math.PI * lonIndex / lonCount;
        const cosLat = Math.cos(lat);
        const inferior = Math.max(0, -Math.sin(lat));
        const taper = 1 - 0.16 * inferior ** 1.6;
        const front = Math.max(0, Math.sin(lon));
        const nose = 9 * Math.exp(-(((lon - Math.PI / 2) / 0.24) ** 2)) * Math.exp(-((lat / 0.33) ** 2));
        vertices.push({
          x: center.x + radii.x * cosLat * Math.cos(lon) * taper,
          y: center.y + radii.y * cosLat * Math.sin(lon) + nose,
          z: center.z + radii.z * Math.sin(lat)
        });
      }
    }
    for (let latIndex = 0; latIndex < latCount - 1; latIndex += 1) {
      for (let lonIndex = 0; lonIndex < lonCount; lonIndex += 1) {
        const nextLon = (lonIndex + 1) % lonCount;
        const a = latIndex * lonCount + lonIndex;
        const b = latIndex * lonCount + nextLon;
        const c = (latIndex + 1) * lonCount + lonIndex;
        const d = (latIndex + 1) * lonCount + nextLon;
        i.push(a, b); j.push(c, c); k.push(b, d);
      }
    }
    return { vertices, i, j, k, source: "analytic head phantom" };
  }



  function hexToRgb(hex) {
    const normalized = String(hex).replace("#", "");
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function rgbToHex({ r, g, b }) {
    const component = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
    return `#${component(r)}${component(g)}${component(b)}`;
  }

  function blendColor(hex, target, amount) {
    const source = hexToRgb(hex);
    return rgbToHex({
      r: source.r + (target.r - source.r) * amount,
      g: source.g + (target.g - source.g) * amount,
      b: source.b + (target.b - source.b) * amount
    });
  }

  function headVertexColors(vertices, baseColor) {
    const ys = vertices.map((v) => v.y);
    const zs = vertices.map((v) => v.z);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    return vertices.map((v) => {
      const front = (v.y - minY) / Math.max(maxY - minY, 1);
      const upper = (v.z - minZ) / Math.max(maxZ - minZ, 1);
      const lightAmount = clamp(0.03 + 0.12 * front + 0.08 * upper, 0, 0.23);
      return blendColor(baseColor, { r: 255, g: 255, b: 255 }, lightAmount);
    });
  }



  function getControlValues() {
    return {
      headModel: dom["head-model-select"].value,
      autoFit: dom["auto-fit-checkbox"].checked,
      fitSource: dom["fit-source-select"].value,
      projectElectrodes: dom["project-electrodes-checkbox"].checked,
      comparisonLayout: dom["comparison-layout-select"].value,
      comparisonAlignment: dom["comparison-alignment-select"].value,
      syncCameras: dom["sync-cameras-checkbox"].checked,
      clearance: Number(dom["clearance-range"].value),
      headScale: Number(dom["head-scale-range"].value),
      headOpacity: Number(dom["head-opacity-range"].value),
      headColor: dom["head-color-input"].value,
      headContours: dom["head-contours-checkbox"].checked,
      referenceColor: dom["reference-color-input"].value,
      referenceSize: Number(dom["reference-size-range"].value),
      referenceOpacity: Number(dom["reference-opacity-range"].value),
      comparisonColor: dom["comparison-color-input"].value,
      comparisonSize: Number(dom["comparison-size-range"].value),
      comparisonOpacity: Number(dom["comparison-opacity-range"].value),
      showLabels: dom["show-labels-checkbox"].checked,
      labelColor: dom["label-color-input"].value,
      fontSize: Number(dom["font-size-range"].value),
      hitboxSize: Number(dom["hitbox-size-range"].value),
      backgroundColor: dom["background-color-input"].value,
      showLines: dom["show-lines-checkbox"].checked,
      colorByDistance: dom["color-by-distance-checkbox"].checked,
      lineOpacity: Number(dom["line-opacity-range"].value)
    };
  }

  function electrodeCustomData(electrode, cap, comparisonLookup) {
    const comparison = comparisonLookup.get(labelKey(electrode.label));
    const info = inferElectrodeInfo(electrode);
    const mni = mniCoordinate(electrode);
    const mniHover = mni
      ? `Template MNI/fsaverage scalp: x ${mni.x.toFixed(2)} · y ${mni.y.toFixed(2)} · z ${mni.z.toFixed(2)} mm`
      : "Template MNI/fsaverage scalp projection unavailable";
    return [
      electrode.label, cap, electrode.x, electrode.y, electrode.z,
      info.scalp, info.region, info.functions, electrode.hemisphere,
      info.source, info.confidence, electrode.coordinateFrame, electrode.mniCompatible,
      info.sourceLabel, info.sourceUrl, info.anatomyLabel, info.anatomyUrl,
      comparison ? comparison.distance : null,
      comparison ? comparison.dx : null,
      comparison ? comparison.dy : null,
      comparison ? comparison.dz : null,
      info.category,
      mni ? mni.x : null,
      mni ? mni.y : null,
      mni ? mni.z : null,
      electrode.mniProjectionKind || "unavailable",
      electrode.mniProjectionMethod || "MNI projection unavailable.",
      electrode.mniProjectionBasis || "",
      Number.isFinite(electrode.mniProjectionDistanceMm) ? electrode.mniProjectionDistanceMm : null,
      Number.isFinite(electrode.mniRegistrationResidualMm) ? electrode.mniRegistrationResidualMm : null,
      electrode.mniProjectionWarning || "",
      mniHover,
      comparison && Number.isFinite(comparison.mniDistance) ? comparison.mniDistance : null,
      comparison && Number.isFinite(comparison.mniDx) ? comparison.mniDx : null,
      comparison && Number.isFinite(comparison.mniDy) ? comparison.mniDy : null,
      comparison && Number.isFinite(comparison.mniDz) ? comparison.mniDz : null,
      comparison ? comparison.framesEquivalent : null,
      comparison ? comparison.reference.coordinateFrame : "",
      comparison ? comparison.comparison.coordinateFrame : "",
      JSON.stringify(info.references || []),
      info.evidenceLevel || "",
      displayCoordinate(cap, electrode).projected ? `Display-only scalp adjustment: ${displayCoordinate(cap, electrode).adjustment.toFixed(2)} mm. Source coordinates above are unchanged.` : "Raw-coordinate display (only a rigid viewing transform)."
    ];
  }

  function makeHoverTemplate(capLabel) {
    return `<b>%{customdata[0]}</b> · ${capLabel}<br>` +
      `Source: x %{customdata[2]:.2f} · y %{customdata[3]:.2f} · z %{customdata[4]:.2f} mm<br>` +
      `%{customdata[31]}<br>` +
      `%{customdata[5]}<br>%{customdata[6]}<br>%{customdata[41]}<br>` +
      `<extra></extra>`;
  }

  function makeCapTraces(electrodes, cap, color, size, opacity, controls, comparisonLookup, distanceColors = false) {
    if (!electrodes.length) return [];
    const customdata = electrodes.map((electrode) => electrodeCustomData(electrode, cap, comparisonLookup));
    const hovertemplate = makeHoverTemplate(cap === "reference" ? "Reference" : "Comparison");
    const markerColor = distanceColors
      ? electrodes.map((electrode) => comparisonLookup.get(labelKey(electrode.label))?.distance ?? 0)
      : color;
    const marker = {
      size,
      color: markerColor,
      opacity,
      line: { color: "rgba(255,255,255,0.9)", width: 1 }
    };
    if (distanceColors) {
      const maximum = Math.max(1, ...state.comparisonRows.map((row) => row.distance));
      Object.assign(marker, {
        colorscale: "Turbo",
        cmin: 0,
        cmax: maximum,
        showscale: true,
        colorbar: { title: { text: "Distance<br>(mm)" }, thickness: 14, len: 0.45, x: 1.02 }
      });
    }

    const hitbox = {
      type: "scatter3d",
      mode: "markers",
      name: `${cap} selection area`,
      scene: displayCoordinate(cap, electrodes[0]).scene,
      x: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.x),
      y: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.y),
      z: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.z),
      customdata,
      hovertemplate,
      marker: { size: Math.max(controls.hitboxSize, size + 4), color, opacity: 0.025 },
      showlegend: false,
      legendgroup: cap
    };

    const visible = {
      type: "scatter3d",
      mode: controls.showLabels ? "markers+text" : "markers",
      name: cap === "reference" ? state.referenceName : state.comparisonName,
      scene: displayCoordinate(cap, electrodes[0]).scene,
      x: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.x),
      y: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.y),
      z: electrodes.map((electrode) => displayCoordinate(cap, electrode).point.z),
      text: electrodes.map((electrode) => electrode.label),
      textposition: "top center",
      textfont: { size: controls.fontSize, color: controls.labelColor },
      customdata,
      hovertemplate,
      marker,
      showlegend: true,
      legendgroup: cap
    };
    return [hitbox, visible];
  }

  function displacementTrace(rows, controls) {
    const x = []; const y = []; const z = [];
    rows.forEach((row) => {
      const a = displayCoordinate("reference", row.reference).point, b = displayCoordinate("comparison", row.comparison).point;
      x.push(a.x, b.x, null); y.push(a.y, b.y, null); z.push(a.z, b.z, null);
    });
    return {
      type: "scatter3d",
      mode: "lines",
      name: "Matched labels (display links)",
      x, y, z,
      hoverinfo: "skip",
      line: { color: `rgba(78, 86, 102, ${controls.lineOpacity})`, width: 3 },
      showlegend: true
    };
  }

  function selectedHighlightTrace(comparisonLookup) {
    const selected = state.lastClicked || state.hoverPreview;
    if (!selected) return null;
    const source = capElectrodes(selected.cap);
    const electrode = source.find((candidate) => labelKey(candidate.label) === labelKey(selected.label));
    if (!electrode || !isElectrodeVisible(selected.cap, electrode)) return null;
    return {
      type: "scatter3d",
      mode: "markers",
      name: "Selected electrode",
      x: [displayCoordinate(selected.cap, electrode).point.x], y: [displayCoordinate(selected.cap, electrode).point.y], z: [displayCoordinate(selected.cap, electrode).point.z],
      scene: displayCoordinate(selected.cap, electrode).scene,
      customdata: [electrodeCustomData(electrode, selected.cap, comparisonLookup)],
      hovertemplate: makeHoverTemplate("Selected"),
      marker: { size: 14, color: "rgba(255,255,255,0.12)", line: { color: "#111827", width: 5 }, opacity: 1 },
      showlegend: false
    };
  }

  function headTrace(head, controls) {
    return {
      type: "mesh3d", scene: head.scene,
      name: head.cap === "comparison" ? "Comparison head" : "Reference head",
      x: head.vertices.map(v => v.x), y: head.vertices.map(v => v.y), z: head.vertices.map(v => v.z),
      i: head.i, j: head.j, k: head.k,
      vertexcolor: headVertexColors(head.vertices, controls.headColor), opacity: controls.headOpacity,
      flatshading: false, hoverinfo: "skip",
      lighting: { ambient: 0.58, diffuse: 0.78, specular: 0.24, roughness: 0.72, fresnel: 0.08 },
      lightposition: { x: 180, y: 260, z: 380 },
      contour: { show: controls.headContours, color: blendColor(controls.headColor, { r: 40, g: 45, b: 55 }, 0.32), width: 1 },
      showscale: false, showlegend: false
    };
  }

  function buildPlotData() {
    state.comparisonRows = computeComparison(state.reference, state.comparison);
    const lookup = comparisonMapByLabel(state.comparisonRows), controls = getControlValues();
    syncHeadControls();
    const display = buildDisplayGeometry(controls);
    const traces = display.heads.map(h => headTrace(h, controls));
    const rows = state.comparisonRows.filter(row => isElectrodeVisible("reference", row.reference) && isElectrodeVisible("comparison", row.comparison));
    if (controls.showLines && rows.length && !display.split) traces.push(displacementTrace(rows, controls));
    traces.push(...makeCapTraces(visibleElectrodes("reference"), "reference", controls.referenceColor, controls.referenceSize, controls.referenceOpacity, controls, lookup));
    traces.push(...makeCapTraces(visibleElectrodes("comparison"), "comparison", controls.comparisonColor, controls.comparisonSize, controls.comparisonOpacity, controls, lookup, controls.colorByDistance));
    const highlight = selectedHighlightTrace(lookup); if (highlight) traces.push(highlight);
    dom["eeg-plot"].classList.toggle("two-heads", display.split);
    dom["eeg-plot"].classList.toggle("stacked-heads", display.split && dom["eeg-plot"].clientWidth < 700);
    dom["display-mode-status"].textContent = `${display.split ? "Two independently fitted heads" : `One shared head fitted to ${display.anchorCap === "reference" ? "Cap A (reference)" : "Cap B (comparison)"}`}. ${display.alignment} ${controls.projectElectrodes ? "Markers are projected to the scalp for display; links are not measurement rulers." : "Raw-coordinate view: scalp projection is off, so true scalp gaps remain visible."}`;
    dom["comparison-frame-note"].textContent = state.comparison.length && !sourceFramesComparable(state.reference[0], state.comparison[0])
      ? "Source frames are not known to match. Source-space distances below are arithmetic differences, not validated physical displacements. Matching labels alone does not verify equivalent sensor definitions across manufacturers. Display alignment/projection does not change these numbers."
      : "Source distances use unmodified coordinates. Head selection, layout and display projection never change these values; matching frame declarations are not independent registration verification.";
    return { traces, controls, display };
  }

  function plotLayout(controls) {
    const display = state.displayGeometry;
    const split = display.split;
    const narrow = dom["eeg-plot"].clientWidth < 700;
    const all = display.heads.flatMap(h => h.vertices);
    if (!controls.projectElectrodes) {
      for (const cap of ["reference", "comparison"]) display.positions[cap].forEach(p => all.push(p.point));
    }
    const bounds = {};
    for (const axis of ["x", "y", "z"]) {
      let low = Infinity, high = -Infinity;
      all.forEach(p => { low = Math.min(low, p[axis]); high = Math.max(high, p[axis]); });
      const pad = Math.max(10, (high - low) * 0.08);
      bounds[axis] = [low - pad, high + pad];
    }
    const spans = Object.fromEntries(["x", "y", "z"].map(axis => [axis, bounds[axis][1] - bounds[axis][0]]));
    const spanUnit = Math.cbrt(spans.x * spans.y * spans.z);
    const aspectratio = { x: spans.x / spanUnit, y: spans.y / spanUnit, z: spans.z / spanUnit };
    const camera = state.camera || CAMERA_VIEWS[state.currentView] || CAMERA_VIEWS.default;
    const scene = (domain, cam) => ({
      domain, camera: JSON.parse(JSON.stringify(cam)), dragmode: "orbit", aspectmode: "manual", aspectratio: { ...aspectratio }, bgcolor: controls.backgroundColor,
      xaxis: { visible: false, title: "Display X (mm)", range: bounds.x, autorange: false },
      yaxis: { visible: false, title: "Display Y (mm)", range: bounds.y, autorange: false },
      zaxis: { visible: false, title: "Display Z (mm)", range: bounds.z, autorange: false }
    });
    const layout = {
      autosize: true, margin: { l: 0, r: controls.colorByDistance && state.comparison.length ? 70 : 10, t: split ? 40 : 10, b: 0 },
      paper_bgcolor: controls.backgroundColor, plot_bgcolor: controls.backgroundColor, hovermode: "closest",
      uirevision: `eeg-head-fit-v12-${state.dataRevision}-${split}-${narrow}`,
      legend: { x: 0.015, y: split ? -0.015 : 0.985, xanchor: "left", yanchor: split ? "top" : "top",
        orientation: split ? "h" : "v", bgcolor: "rgba(255,255,255,0.72)", bordercolor: "rgba(120,130,145,0.35)", borderwidth: 1, font: { size: 11 } },
      scene: scene(split ? (narrow ? { x: [0,1], y: [0.53,1] } : { x: [0,0.48], y: [0,1] }) : { x: [0,1], y: [0,1] }, camera)
    };
    if (split) {
      layout.scene2 = scene(narrow ? { x: [0,1], y: [0,0.47] } : { x: [0.52,1], y: [0,1] }, controls.syncCameras ? camera : state.comparisonCamera || camera);
      layout.margin.b = 45;
      layout.annotations = ["reference", "comparison"].map((cap,i) => ({
        text: `${cap === "reference" ? "Cap A: reference" : "Cap B: comparison"}${display.anchorCap === cap ? " <b>(display reference)</b>" : ""}`,
        xref: "paper", yref: "paper", x: narrow ? 0.5 : (i ? 0.76 : 0.24), y: narrow && i ? 0.49 : 1.04,
        showarrow: false, font: { size: 12, color: cap === "reference" ? controls.referenceColor : controls.comparisonColor }
      }));
    }
    return layout;
  }


  const PLOT_CONFIG = {
    responsive: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: ["sendDataToCloud", "hoverClosest3d"]
  };

  function scheduleRender(delay = 35) {
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(render, delay);
  }

  async function render() {
    if (state.renderBusy) { state.renderAgain = true; return; }
    state.renderBusy = true;
    try {
      dom["loading-overlay"].classList.remove("hidden");
      const { traces, controls } = buildPlotData();
      await Plotly.react(dom["eeg-plot"], traces, plotLayout(controls), PLOT_CONFIG);
      if (!state.plotInitialized) {
        bindPlotEvents();
        state.plotInitialized = true;
      }
      updateComparisonSummary();
      updateHeadStatus();
      updateSelectedCard();
    } catch (error) {
      console.error(error);
      dom["head-model-status"].textContent = `Viewer error: ${error.message}`;
      dom["head-model-status"].className = "model-status error";
    } finally {
      dom["loading-overlay"].classList.add("hidden");
      state.renderBusy = false;
      if (state.renderAgain) { state.renderAgain = false; scheduleRender(0); }
    }
  }

  function bindPlotEvents() {
    dom["eeg-plot"].on("plotly_click", (event) => {
      const data = event?.points?.[0]?.customdata;
      if (!Array.isArray(data)) return;
      const selection = { label: data[0], cap: data[1] };
      if (state.visibilityEditMode) {
        state.hidden[selection.cap].add(labelKey(selection.label));
        state.lastClicked = null;
        state.hoverPreview = null;
        renderVisibilityList();
        scheduleRender(0);
        return;
      }
      state.lastClicked = selection;
      state.hoverPreview = null;
      updateSelectedCard(data);
      scheduleRender(0);
    });
    dom["eeg-plot"].on("plotly_hover", (event) => {
      if (state.visibilityEditMode) return;
      const data = event?.points?.[0]?.customdata;
      if (!Array.isArray(data)) return;
      state.hoverPreview = { label: data[0], cap: data[1] };
      updateSelectedCard(data, true);
      updateHeadStatus();
    });
    dom["eeg-plot"].on("plotly_relayout", event => {
      if (state.syncingCamera) return;
      const a = event?.["scene.camera"], b = event?.["scene2.camera"];
      if (a) state.camera = a;
      if (b) state.comparisonCamera = b;
      if ((a || b) && state.displayGeometry?.split && dom["sync-cameras-checkbox"].checked) {
        state.camera = a || b;
        state.comparisonCamera = a || b;
        state.syncingCamera = true;
        Promise.resolve(Plotly.relayout(dom["eeg-plot"], { [a ? "scene2.camera" : "scene.camera"]: a || b }))
          .finally(() => { state.syncingCamera = false; });
      }
    });
    dom["eeg-plot"].on("plotly_unhover", () => {
      state.hoverPreview = null;
      updateSelectedCard();
    });
  }

  function customDataForSelection(selection) {
    if (!selection) return null;
    const comparisonLookup = comparisonMapByLabel(state.comparisonRows);
    const electrodes = capElectrodes(selection.cap);
    const electrode = electrodes.find((candidate) => labelKey(candidate.label) === labelKey(selection.label));
    return electrode ? electrodeCustomData(electrode, selection.cap, comparisonLookup) : null;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function referenceLink(label, url) {
    const safe = safeExternalUrl(url);
    return safe ? `<a class="reference-link" href="${escapeHtml(safe)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>` : "";
  }

  function parseReferencePayload(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function uniqueReferenceLinks(references) {
    const seen = new Set();
    return references
      .map((reference) => ({
        label: String(reference?.label || "Reference").trim(),
        url: safeExternalUrl(reference?.url || ""),
        type: String(reference?.type || "").trim()
      }))
      .filter((reference) => {
        if (!reference.url || seen.has(reference.url)) return false;
        seen.add(reference.url);
        return true;
      })
      .map((reference) => referenceLink(
        reference.type ? `${reference.label} · ${reference.type}` : reference.label,
        reference.url
      ))
      .filter(Boolean)
      .join("");
  }

  function projectionKindLabel(kind) {
    const labels = {
      native_mni_surface_projection: "Direct MNI/fsaverage surface projection",
      csv_supplied_mni_surface_projection: "CSV-supplied MNI surface projection",
      csv_pair_registered_surface_estimate: "CSV-pair registered template estimate",
      fiducial_registered_surface_estimate: "Fiducial-registered template estimate",
      label_registered_surface_estimate: "Label-registered template estimate",
      unavailable: "MNI projection unavailable"
    };
    return labels[kind] || "Template-MNI surface estimate";
  }

  function updateCoordinateStrip(data, preview = false) {
    if (!Array.isArray(data)) {
      dom["selected-coordinate-strip"].className = "selected-coordinate-strip";
      dom["selected-coordinate-label"].textContent = "No electrode selected";
      dom["selected-coordinate-frame"].textContent = "Coordinate frame not selected.";
      dom["selected-coordinate-value"].textContent = "x — · y — · z —";
      dom["selected-mni-coordinate-value"].textContent = "x — · y — · z —";
      dom["selected-mni-coordinate-method"].textContent = "Projection method will be shown here.";
      return;
    }
    const [label, cap, x, y, z, , , , , , , coordinateFrame, sourceIsMni, , , , , , , , , ,
      mniX, mniY, mniZ, projectionKind, projectionMethod, projectionBasis, projectionDistance, registrationResidual] = data;
    const capLabel = cap === "comparison" ? "Comparison cap" : "Reference cap";
    const hasMni = [mniX, mniY, mniZ].every(Number.isFinite);
    dom["selected-coordinate-strip"].className = `selected-coordinate-strip ${hasMni ? "mni" : "template"}`;
    dom["selected-coordinate-label"].textContent = `${label} · ${capLabel}${preview ? " · hover preview" : ""}`;
    dom["selected-coordinate-frame"].textContent = `${coordinateFrame || "Coordinate frame not supplied"}${sourceIsMni ? " · MNI/fsaverage-compatible source" : " · exact source values preserved"}`;
    dom["selected-coordinate-value"].textContent = `x ${Number(x).toFixed(2)} · y ${Number(y).toFixed(2)} · z ${Number(z).toFixed(2)} mm`;
    if (hasMni) {
      dom["selected-mni-coordinate-value"].textContent = `x ${Number(mniX).toFixed(2)} · y ${Number(mniY).toFixed(2)} · z ${Number(mniZ).toFixed(2)} mm`;
      const residual = Number.isFinite(registrationResidual) && projectionKind !== "native_mni_surface_projection"
        ? ` · registration RMS ${Number(registrationResidual).toFixed(2)} mm`
        : "";
      const adjustment = Number.isFinite(projectionDistance) ? ` · surface adjustment ${Number(projectionDistance).toFixed(2)} mm` : "";
      dom["selected-mni-coordinate-method"].textContent = `${projectionKindLabel(projectionKind)}${projectionBasis ? ` · ${projectionBasis}` : ""}${residual}${adjustment}`;
    } else {
      dom["selected-mni-coordinate-value"].textContent = "Unavailable";
      dom["selected-mni-coordinate-method"].textContent = projectionMethod || "Supply MNI coordinates, fiducials, or matching standard electrode labels.";
    }
  }

  function updateSelectedCard(explicitData = null, preview = false) {
    const data = explicitData || customDataForSelection(state.lastClicked || state.hoverPreview);
    if (!Array.isArray(data)) {
      updateCoordinateStrip(null);
      dom["selected-cap-pill"].textContent = "None";
      dom["selected-cap-pill"].className = "status-pill muted";
      dom["selected-electrode-content"].className = "empty-state";
      dom["selected-electrode-content"].textContent = "Click an electrode in the 3D viewer. Hovering also previews its coordinates, regional information, and functional summary.";
      return;
    }
    const [label, cap, x, y, z, scalp, region, functions, hemisphere, regionSource, confidence, coordinateFrame, sourceIsMni,
      sourceLabel, sourceUrl, anatomyLabel, anatomyUrl, distance, dx, dy, dz, category,
      mniX, mniY, mniZ, projectionKind, projectionMethod, projectionBasis, projectionDistance, registrationResidual, projectionWarning,
      , mniDistance, mniDx, mniDy, mniDz, framesEquivalent, referenceFrame, comparisonFrame,
      referencePayload, evidenceLevel] = data;
    updateCoordinateStrip(data, preview);
    dom["selected-cap-pill"].textContent = preview ? `${cap} preview` : cap;
    dom["selected-cap-pill"].className = `status-pill ${cap === "comparison" ? "comparison" : "reference"}`;
    const sourceFrameNote = framesEquivalent === true
      ? `Both files report the same source-frame label: ${escapeHtml(referenceFrame || coordinateFrame || "not supplied")}.`
      : Number.isFinite(distance)
        ? `Source frames differ or could not be confirmed (${escapeHtml(referenceFrame || "not supplied")} vs ${escapeHtml(comparisonFrame || "not supplied")}); interpret this source-space distance cautiously.`
        : "";
    const differenceHtml = Number.isFinite(distance)
      ? `<dt>Source-coordinate cap difference</dt><dd><strong>${distance.toFixed(2)} mm</strong> (Δx ${dx.toFixed(2)}, Δy ${dy.toFixed(2)}, Δz ${dz.toFixed(2)} mm). ${sourceFrameNote}</dd>`
      : "";
    const mniDifferenceHtml = Number.isFinite(mniDistance)
      ? `<dt>Template-MNI scalp difference</dt><dd><strong>${Number(mniDistance).toFixed(2)} mm</strong> (Δx ${Number(mniDx).toFixed(2)}, Δy ${Number(mniDy).toFixed(2)}, Δz ${Number(mniDz).toFixed(2)} mm). This compares the two template-scalp projection estimates.</dd>`
      : "";
    const hasMni = [mniX, mniY, mniZ].every(Number.isFinite);
    const detailedReferences = parseReferencePayload(referencePayload);
    const fallbackReferences = [
      { label: sourceLabel, url: sourceUrl, type: "scalp-to-cortex mapping" },
      { label: anatomyLabel, url: anatomyUrl, type: "functional/anatomical evidence" }
    ];
    if (!detailedReferences.length && MAPPING_REFERENCES[0]) {
      fallbackReferences.push(MAPPING_REFERENCES[0]);
    }
    const links = uniqueReferenceLinks([...detailedReferences, ...fallbackReferences]);
    const projectionDetails = hasMni
      ? `<dt>MNI projection method</dt><dd>${escapeHtml(projectionMethod || projectionKindLabel(projectionKind))}</dd>
         <dt>Registration basis</dt><dd>${escapeHtml(projectionBasis || "template coordinate")}</dd>
         ${Number.isFinite(registrationResidual) ? `<dt>Registration RMS residual</dt><dd>${Number(registrationResidual).toFixed(2)} mm</dd>` : ""}
         ${Number.isFinite(projectionDistance) ? `<dt>Scalp-surface adjustment</dt><dd>${Number(projectionDistance).toFixed(2)} mm</dd>` : ""}`
      : `<dt>MNI projection</dt><dd>Unavailable from the supplied information.</dd>`;
    dom["selected-electrode-content"].className = "";
    dom["selected-electrode-content"].innerHTML = `
      <div class="electrode-name">${escapeHtml(label)}</div>
      <div class="functional-summary"><strong>Functional guide</strong><p>${escapeHtml(functions)}</p></div>
      <dl class="info-list">
        <dt>Scalp position</dt><dd>${escapeHtml(scalp)}</dd>
        <dt>Hemisphere</dt><dd>${escapeHtml(hemisphere)}</dd>
        <dt>Approximate cortex</dt><dd>${escapeHtml(region)}</dd>
        <dt>Evidence level</dt><dd>${escapeHtml(evidenceLevel || "Not specified")}</dd>
        <dt>Mapping basis</dt><dd>${escapeHtml(regionSource)}</dd>
        <dt>Confidence</dt><dd>${escapeHtml(confidence)}</dd>
        ${projectionDetails}
        ${differenceHtml}
        ${mniDifferenceHtml}
      </dl>
      ${links ? `<div class="reference-section"><div class="reference-section-title">References used for this electrode</div><div class="reference-links">${links}</div></div>` : ""}
      <p class="anatomy-caveat">${escapeHtml(projectionWarning || "Template MNI values are visualization-oriented estimates unless the source was already registered to MNI/fsaverage.")} Precise participant-level localization requires digitized electrodes, individual MRI coregistration, and anatomical normalization.</p>`;
  }

  function updateComparisonSummary() {
    const rows = state.comparisonRows;
    dom["matched-count"].textContent = String(rows.length);
    dom["download-comparison-button"].disabled = rows.length === 0;
    if (!rows.length) {
      dom["mean-distance"].textContent = "—";
      dom["max-distance"].textContent = "—";
      dom["comparison-table-wrap"].className = "table-wrap empty-state";
      dom["comparison-table-wrap"].textContent = state.comparison.length ? "No matching electrode labels were found." : "Load a comparison CSV to calculate electrode differences.";
      return;
    }
    const mean = rows.reduce((sum, row) => sum + row.distance, 0) / rows.length;
    const maximum = rows[0];
    dom["mean-distance"].textContent = `${mean.toFixed(2)} mm`;
    dom["max-distance"].textContent = `${maximum.distance.toFixed(2)} mm (${maximum.label})`;
    dom["comparison-table-wrap"].className = "table-wrap";
    dom["comparison-table-wrap"].innerHTML = `
      <table>
        <thead><tr><th>Electrode</th><th>Source distance</th><th>Template-MNI distance</th><th>Δx</th><th>Δy</th><th>Δz</th></tr></thead>
        <tbody>${rows.map((row) => `<tr data-electrode="${escapeHtml(row.label)}"><td>${escapeHtml(row.label)}</td><td>${row.distance.toFixed(2)}</td><td>${Number.isFinite(row.mniDistance) ? row.mniDistance.toFixed(2) : "—"}</td><td>${row.dx.toFixed(2)}</td><td>${row.dy.toFixed(2)}</td><td>${row.dz.toFixed(2)}</td></tr>`).join("")}</tbody>
      </table>`;
    dom["comparison-table-wrap"].querySelectorAll("tbody tr").forEach((rowElement) => {
      rowElement.addEventListener("click", () => {
        state.lastClicked = { label: rowElement.dataset.electrode, cap: "comparison" };
        updateSelectedCard();
        scheduleRender(0);
      });
    });
  }

  function updateHeadStatus() {
    dom["head-model-status"].textContent = state.fitStatus;
    dom["head-model-status"].className = `model-status ${state.displayGeometry?.warnings.length ? "warning" : "success"}`;
    const selection = state.lastClicked || state.hoverPreview;
    let message = "Head fitting and scalp projection affect the drawing only. Original/CSV and template-MNI coordinates below remain unchanged.";
    if (selection) {
      const d = state.displayGeometry?.positions[selection.cap]?.get(labelKey(selection.label));
      if (d?.projected) message += ` Selected marker display adjustment: ${d.adjustment.toFixed(2)} mm.`;
    }
    dom["display-projection-note"].textContent = message;
  }

  function setFileStatus(type, message, isError = false) {
    const element = dom[`${type}-file-status`];
    element.textContent = message;
    element.className = `file-status ${isError ? "error" : "success"}`;
    const pill = dom[`${type}-status-pill`];
    if (isError) {
      pill.textContent = "Error";
      pill.className = "status-pill muted";
    }
  }

  async function loadCSVFile(file, type) {
    if (!file) return;
    const generation = ++state.loadGeneration[type];
    try {
      const text = await readFileAsText(file);
      if (generation !== state.loadGeneration[type]) return;
      const units = dom[`${type}-units`].value;
      const parsed = parseElectrodeCSV(text, units, type);
      state.capContext[type] = { fiducials: parsed.fiducials };
      if (type === "reference") {
        state.reference = parsed.electrodes;
        state.referenceName = file.name.replace(/\.csv$/i, "") || "Reference cap";
        state.referencePresetId = "custom";
        state.referenceIsDefault = false;
        state.hidden.reference.clear();
        dom["montage-select"].value = "custom";
        dom["reference-status-pill"].textContent = "Custom";
        dom["reference-status-pill"].className = "status-pill reference";
        updateMontageDescription();
      } else {
        state.comparison = parsed.electrodes;
        state.comparisonName = file.name.replace(/\.csv$/i, "") || "Comparison cap";
        state.comparisonPresetId = "custom";
        dom["comparison-montage-select"].value = "custom";
        state.hidden.comparison.clear();
        dom["comparison-status-pill"].textContent = "Loaded";
        dom["comparison-status-pill"].className = "status-pill comparison";
      }
      const duplicateText = parsed.duplicateCount ? ` ${parsed.duplicateCount} duplicate label(s) were skipped.` : "";
      const frameSummary = parsed.electrodes[0]?.coordinateFrame || "coordinate frame not supplied";
      const projectionText = `${parsed.projectionSummary.available}/${parsed.electrodes.length} electrodes have a template MNI/fsaverage scalp coordinate`;
      setFileStatus(type, `${parsed.electrodes.length} electrodes loaded; units: ${parsed.detectedUnits}; source frame: ${frameSummary}; ${projectionText}.${duplicateText}`);
      state.lastClicked = null;
      state.hoverPreview = null;
      resetFitForData(type);
      renderVisibilityList();
      scheduleRender(0);
    } catch (error) {
      if (generation === state.loadGeneration[type]) setFileStatus(type, error.message, true);
    }
  }

  function restoreDefaultReference() {
    const presetId = MONTAGES[dom["montage-select"].value] ? dom["montage-select"].value : DEFAULT_MONTAGE_ID;
    loadMontagePreset(presetId);
  }

  function clearComparison() {
    state.loadGeneration.comparison += 1;
    state.comparison = [];
    state.comparisonName = "Comparison cap";
    state.comparisonPresetId = "";
    state.capContext.comparison = {};
    dom["comparison-montage-select"].value = "";
    state.hidden.comparison.clear();
    state.lastClicked = null;
    state.hoverPreview = null;
    dom["comparison-file-input"].value = "";
    dom["comparison-status-pill"].textContent = "Optional";
    dom["comparison-status-pill"].className = "status-pill muted";
    dom["comparison-file-status"].textContent = "No comparison cap loaded.";
    dom["comparison-file-status"].className = "file-status";
    resetFitForData("comparison");
    renderVisibilityList();
    scheduleRender(0);
  }

  function rowsToCSV(rows) {
    return rows.map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(",")).join("\r\n");
  }

  function downloadText(filename, content, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadDefaultCSV() {
    const frame = state.reference[0]?.coordinateFrame || "coordinate frame not supplied";
    const rows = [[
      "label", "x", "y", "z", "coordinate_frame",
      "mni_x", "mni_y", "mni_z", "mni_projection_kind", "mni_projection_method",
      "mni_projection_basis", "mni_registration_rms_residual_mm", "mni_surface_adjustment_mm",
      "region", "function", "region_url"
    ]];
    state.reference.forEach((electrode) => {
      const mni = mniCoordinate(electrode);
      const info = inferElectrodeInfo(electrode);
      rows.push([
        electrode.label, electrode.x, electrode.y, electrode.z, electrode.coordinateFrame || frame,
        mni ? mni.x : "", mni ? mni.y : "", mni ? mni.z : "",
        electrode.mniProjectionKind || "unavailable", electrode.mniProjectionMethod || "",
        electrode.mniProjectionBasis || "", finiteNumberOrNull(electrode.mniRegistrationResidualMm) ?? "",
        finiteNumberOrNull(electrode.mniProjectionDistanceMm) ?? "",
        electrode.region || info.region, electrode.functionText || info.functions, electrode.regionUrl || info.sourceUrl
      ]);
    });
    const base = (state.referencePresetId && state.referencePresetId !== "custom" ? state.referencePresetId : state.referenceName || "eeg_reference").replace(/[^a-zA-Z0-9_-]+/g, "_");
    downloadText(`${base}_source_and_template_mni_coordinates.csv`, rowsToCSV(rows));
  }


  function downloadComparisonCSV() {
    if (!state.comparisonRows.length) return;
    const rows = [[
      "label",
      "reference_source_x", "reference_source_y", "reference_source_z", "reference_source_frame",
      "comparison_source_x", "comparison_source_y", "comparison_source_z", "comparison_source_frame",
      "source_dx", "source_dy", "source_dz", "source_distance_mm", "source_frames_equivalent",
      "reference_template_mni_x", "reference_template_mni_y", "reference_template_mni_z",
      "comparison_template_mni_x", "comparison_template_mni_y", "comparison_template_mni_z",
      "template_mni_dx", "template_mni_dy", "template_mni_dz", "template_mni_distance_mm",
      "reference_mni_projection_method", "comparison_mni_projection_method"
    ]];
    state.comparisonRows.forEach((row) => {
      const referenceMni = mniCoordinate(row.reference);
      const comparisonMni = mniCoordinate(row.comparison);
      rows.push([
        row.label,
        row.reference.x.toFixed(5), row.reference.y.toFixed(5), row.reference.z.toFixed(5), row.reference.coordinateFrame || "",
        row.comparison.x.toFixed(5), row.comparison.y.toFixed(5), row.comparison.z.toFixed(5), row.comparison.coordinateFrame || "",
        row.dx.toFixed(5), row.dy.toFixed(5), row.dz.toFixed(5), row.distance.toFixed(5), row.framesEquivalent,
        referenceMni ? referenceMni.x.toFixed(5) : "", referenceMni ? referenceMni.y.toFixed(5) : "", referenceMni ? referenceMni.z.toFixed(5) : "",
        comparisonMni ? comparisonMni.x.toFixed(5) : "", comparisonMni ? comparisonMni.y.toFixed(5) : "", comparisonMni ? comparisonMni.z.toFixed(5) : "",
        Number.isFinite(row.mniDx) ? row.mniDx.toFixed(5) : "", Number.isFinite(row.mniDy) ? row.mniDy.toFixed(5) : "", Number.isFinite(row.mniDz) ? row.mniDz.toFixed(5) : "", Number.isFinite(row.mniDistance) ? row.mniDistance.toFixed(5) : "",
        row.reference.mniProjectionMethod || "", row.comparison.mniProjectionMethod || ""
      ]);
    });
    downloadText("eeg_cap_source_and_template_mni_comparison.csv", rowsToCSV(rows));
  }

  function updateRangeOutputs() {

    dom["clearance-output"].textContent = `${Number(dom["clearance-range"].value).toFixed(1)} mm`;
    dom["head-scale-output"].textContent = Number(dom["head-scale-range"].value).toFixed(2);
    dom["head-opacity-output"].textContent = Number(dom["head-opacity-range"].value).toFixed(2);
    dom["reference-size-output"].textContent = dom["reference-size-range"].value;
    dom["reference-opacity-output"].textContent = Number(dom["reference-opacity-range"].value).toFixed(2);
    dom["comparison-size-output"].textContent = dom["comparison-size-range"].value;
    dom["comparison-opacity-output"].textContent = Number(dom["comparison-opacity-range"].value).toFixed(2);
    dom["font-size-output"].textContent = `${dom["font-size-range"].value} px`;
    dom["hitbox-size-output"].textContent = dom["hitbox-size-range"].value;
    dom["line-opacity-output"].textContent = Number(dom["line-opacity-range"].value).toFixed(2);
  }

  function setControlValues(values) {
    dom["head-model-select"].value = values.headModel;
    dom["auto-fit-checkbox"].checked = values.autoFit;
    dom["fit-source-select"].value = values.fitSource;
    dom["project-electrodes-checkbox"].checked = values.projectElectrodes;
    dom["comparison-layout-select"].value = values.comparisonLayout;
    dom["comparison-alignment-select"].value = values.comparisonAlignment;
    dom["sync-cameras-checkbox"].checked = values.syncCameras;
    dom["clearance-range"].value = values.clearance;
    dom["head-scale-range"].value = values.headScale;
    dom["head-opacity-range"].value = values.headOpacity;
    dom["head-color-input"].value = values.headColor;
    dom["head-contours-checkbox"].checked = values.headContours;
    dom["reference-color-input"].value = values.referenceColor;
    dom["reference-size-range"].value = values.referenceSize;
    dom["reference-opacity-range"].value = values.referenceOpacity;
    dom["comparison-color-input"].value = values.comparisonColor;
    dom["comparison-size-range"].value = values.comparisonSize;
    dom["comparison-opacity-range"].value = values.comparisonOpacity;
    dom["show-labels-checkbox"].checked = values.showLabels;
    dom["label-color-input"].value = values.labelColor;
    dom["font-size-range"].value = values.fontSize;
    dom["hitbox-size-range"].value = values.hitboxSize;
    dom["background-color-input"].value = values.backgroundColor;
    dom["show-lines-checkbox"].checked = values.showLines;
    dom["color-by-distance-checkbox"].checked = values.colorByDistance;
    dom["line-opacity-range"].value = values.lineOpacity;
    updateRangeOutputs();
  }

  function resetAll() {
    setControlValues(DEFAULT_CONTROL_VALUES);
    state.currentView = "default";
    state.camera = null; state.comparisonCamera = null;
    setVisibilityEditMode(false);
    document.querySelectorAll(".view-button").forEach((button) => button.classList.toggle("active", button.dataset.view === "default"));
    loadMontagePreset(DEFAULT_MONTAGE_ID);
    clearComparison();
    state.lastClicked = null;
    scheduleRender(0);
  }

  function bindControls() {
    dom["comparison-montage-select"].addEventListener("change", event => {
      if (MONTAGES[event.target.value]) loadComparisonPreset(event.target.value);
      else if (!event.target.value) clearComparison();
    });
    dom["refit-head-button"].addEventListener("click", () => {
      resetFitForData("reference");
      scheduleRender(0);
    });
    dom["montage-select"].addEventListener("change", (event) => {
      if (MONTAGES[event.target.value]) loadMontagePreset(event.target.value);
    });
    dom["reference-file-input"].addEventListener("change", (event) => loadCSVFile(event.target.files?.[0], "reference"));
    dom["comparison-file-input"].addEventListener("change", (event) => loadCSVFile(event.target.files?.[0], "comparison"));
    dom["restore-default-button"].addEventListener("click", restoreDefaultReference);
    dom["clear-comparison-button"].addEventListener("click", clearComparison);
    dom["download-default-button"].addEventListener("click", downloadDefaultCSV);
    dom["download-comparison-button"].addEventListener("click", downloadComparisonCSV);
    dom["reset-all-button"].addEventListener("click", resetAll);
    dom["fullscreen-button"].addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await dom["app-shell"].requestFullscreen();
        else await document.exitFullscreen();
      } catch (error) {
        console.warn("Full-screen request failed", error);
      }
    });

    dom["visibility-edit-button"].addEventListener("click", () => {
      setVisibilityEditMode(!state.visibilityEditMode);
    });
    dom["visibility-target-select"].addEventListener("change", renderVisibilityList);
    dom["visibility-search-input"].addEventListener("input", renderVisibilityList);
    dom["visibility-show-all-button"].addEventListener("click", () => applyVisibilityAction("show"));
    dom["visibility-hide-all-button"].addEventListener("click", () => applyVisibilityAction("hide"));
    dom["visibility-invert-button"].addEventListener("click", () => applyVisibilityAction("invert"));

    const rerenderIds = [
      "head-model-select", "auto-fit-checkbox", "fit-source-select", "project-electrodes-checkbox", "comparison-layout-select", "comparison-alignment-select", "sync-cameras-checkbox", "clearance-range",
      "head-scale-range", "head-opacity-range", "head-color-input", "head-contours-checkbox",
      "reference-color-input", "reference-size-range", "reference-opacity-range", "comparison-color-input",
      "comparison-size-range", "comparison-opacity-range", "show-labels-checkbox", "label-color-input",
      "font-size-range", "hitbox-size-range", "background-color-input", "show-lines-checkbox",
      "color-by-distance-checkbox", "line-opacity-range"
    ];
    rerenderIds.forEach((id) => {
      const eventName = dom[id].type === "range" || dom[id].type === "color" ? "input" : "change";
      dom[id].addEventListener(eventName, () => {
        syncHeadControls();
        updateRangeOutputs();
        scheduleRender();
      });
    });

    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.currentView = button.dataset.view;
        document.querySelectorAll(".view-button").forEach((other) => other.classList.toggle("active", other === button));
        state.camera = CAMERA_VIEWS[state.currentView]; state.comparisonCamera = state.camera;
        const cameras = { "scene.camera": state.camera };
        if (state.displayGeometry?.split) cameras["scene2.camera"] = state.camera;
        Plotly.relayout(dom["eeg-plot"], cameras);
      });
    });

    window.addEventListener("resize", () => { Plotly.Plots.resize(dom["eeg-plot"]); scheduleRender(100); });
  }

  function applyConfiguration() {
    if (CONFIG.title) {
      document.title = CONFIG.title;
      dom["app-title"].textContent = CONFIG.title;
    }
    if (CONFIG.subtitle) dom["app-subtitle"].textContent = CONFIG.subtitle;
    dom["version-badge"].textContent = CONFIG.version || "1.2.0";
    const query = new URLSearchParams(window.location.search);
    if (query.get("embed") === "1") document.body.classList.add("embed");
  }

  function validateAssets() {
    if (!window.Plotly) throw new Error("Plotly.js did not load.");
    if (!Object.keys(MONTAGES).length) throw new Error("Built-in montage presets did not load.");
    if (!DEFAULT_COORDS.length) throw new Error("Default electrode coordinates did not load.");
    if (!TEMPLATE_MESH) throw new Error("Template scalp mesh did not load.");
    if (!FITTING) throw new Error("Head-fitting module did not load. Upload js/head-fitting.js with this release.");
  }

  async function initialize() {
    cacheDom();
    applyConfiguration();
    validateAssets();
    setControlValues(DEFAULT_CONTROL_VALUES);
    populateMontageSelector();
    state.reference = clonePresetCoordinates(DEFAULT_MONTAGE_ID, "reference");
    state.referenceName = DEFAULT_PRESET?.label || CONFIG.defaultReferenceName || "International 10–10 reference";
    state.referencePresetId = DEFAULT_MONTAGE_ID;
    setFileStatus("reference", `${state.reference.length} built-in electrodes loaded. Source frame: ${DEFAULT_PRESET?.coordinateFrame || "template coordinates"}. ${projectionAvailabilityText(state.reference)}`);
    bindControls();
    setVisibilityEditMode(false);
    syncHeadControls();
    renderVisibilityList();
    await render();
    window.EEGViewerDebug = {
      getState: () => ({
        referenceCount: state.reference.length,
        comparisonCount: state.comparison.length,
        visibleReferenceCount: visibleElectrodes("reference").length,
        visibleComparisonCount: visibleElectrodes("comparison").length,
        presetId: state.referencePresetId,
        comparisonPresetId: state.comparisonPresetId,
        headReference: dom["fit-source-select"].value,
        layout: dom["comparison-layout-select"].value,
        dataRevision: state.dataRevision,
        fitStatus: state.fitStatus
      }),
      selectElectrode: (label, cap = "reference") => {
        state.lastClicked = { label, cap };
        updateSelectedCard();
        scheduleRender(0);
      },
      loadMontagePreset,
      loadComparisonPreset,
      loadCSVFile,
      getDisplayGeometry: () => state.displayGeometry,
      getElectrodes: cap => capElectrodes(cap),
      getComparisonRows: () => state.comparisonRows,
      getControlValues,
      render,
      buildPlotData,
      parseElectrodeCSV,
      computeComparison,
      mniCoordinate,
      projectionAvailabilityText
    };
    window.dispatchEvent(new CustomEvent("eegviewer:ready", {
      detail: {
        version: CONFIG.version || "unknown",
        referenceElectrodes: state.reference.length,
        montage: state.referencePresetId
      }
    }));
  }

  window.addEventListener("DOMContentLoaded", () => {
    initialize().catch((error) => {
      console.error(error);
      const overlay = byId("loading-overlay");
      if (overlay) overlay.innerHTML = `<strong>Viewer initialization failed:</strong>&nbsp;${escapeHtml(error.message)}`;
    });
  });
})();
