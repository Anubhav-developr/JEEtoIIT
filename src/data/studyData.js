const PYQ_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

const SYLLABUS_DATA = {
  physics: [
      { id: 'p1', name: 'Units & Measurements', sub: [{id:'p1-1', name:'Dimensional Analysis'}, {id:'p1-2', name:'Error Analysis & Vernier/Screw Gauge'}] },
      { id: 'p2', name: 'Kinematics', sub: [{id:'p2-1', name:'1D Motion'}, {id:'p2-2', name:'Projectile Motion'}, {id:'p2-3', name:'Relative Velocity'}] },
      { id: 'p3', name: 'Laws of Motion', sub: [{id:'p3-1', name:'Newton\'s Laws & Constraints'}, {id:'p3-2', name:'Friction'}, {id:'p3-3', name:'Circular Motion Dynamics'}] },
      { id: 'p4', name: 'Work, Energy & Power', sub: [{id:'p4-1', name:'Work Energy Theorem'}, {id:'p4-2', name:'Potential Energy & Collisions'}] },
      { id: 'p5', name: 'Rotational Motion', sub: [{id:'p5-1', name:'Center of Mass'}, {id:'p5-2', name:'Moment of Inertia'}, {id:'p5-3', name:'Torque & Angular Momentum'}, {id:'p5-4', name:'Rolling Motion'}] },
      { id: 'p6', name: 'Gravitation', sub: [{id:'p6-1', name:'Gravitational Field & Potential'}, {id:'p6-2', name:'Orbital Motion & Escape Velocity'}] },
      { id: 'p7', name: 'Fluids & Solids', sub: [{id:'p7-1', name:'Elasticity'}, {id:'p7-2', name:'Fluid Statics & Bernoulli Theorem'}, {id:'p7-3', name:'Surface Tension & Viscosity'}] },
      { id: 'p10', name: 'Electrostatics', sub: [{id:'p10-1', name:'Coulomb Law & Field'}, {id:'p10-2', name:'Gauss Law & Potential'}, {id:'p10-3', name:'Capacitance'}] },
      { id: 'p11', name: 'Current Electricity', sub: [{id:'p11-1', name:'Ohm Law & Resistance'}, {id:'p11-2', name:'Kirchhoff Laws & Circuits'}] },
      { id: 'p12', name: 'Magnetic Effects', sub: [{id:'p12-1', name:'Biot-Savart & Ampere Law'}, {id:'p12-2', name:'Magnetic Force & Dipole'}] },
      { id: 'p14', name: 'Optics', sub: [{id:'p14-1', name:'Ray Optics'}, {id:'p14-2', name:'Wave Optics (YDSE)'}] },
      { id: 'p15', name: 'Modern Physics', sub: [{id:'p15-1', name:'Photoelectric Effect'}, {id:'p15-2', name:'Bohr Atom'}, {id:'p15-3', name:'Nuclei & Radioactivity'}] }
  ],
  chemistry: [
      { id: 'c1', name: 'Basic Concepts (Mole)', sub: [{id:'c1-1', name:'Mole Concept & Stoichiometry'}, {id:'c1-2', name:'Concentration Terms'}] },
      { id: 'c2', name: 'Atomic Structure', sub: [{id:'c2-1', name:'Bohr Model & Spectrum'}, {id:'c2-2', name:'Quantum Numbers & Orbitals'}] },
      { id: 'c3', name: 'Chemical Bonding', sub: [{id:'c3-1', name:'VSEPR Theory'}, {id:'c3-2', name:'Hybridization'}, {id:'c3-3', name:'MOT'}] },
      { id: 'c4', name: 'Thermodynamics', sub: [{id:'c4-1', name:'Enthalpy & First Law'}, {id:'c4-2', name:'Entropy & Gibbs Free Energy'}] },
      { id: 'c6', name: 'Equilibrium', sub: [{id:'c6-1', name:'Chemical Equilibrium'}, {id:'c6-2', name:'Ionic Equilibrium & pH'}] },
      { id: 'c7', name: 'Electrochemistry', sub: [{id:'c7-1', name:'Redox Reactions'}, {id:'c7-2', name:'Nernst Equation & Conductance'}] },
      { id: 'c8', name: 'Chemical Kinetics', sub: [{id:'c8-1', name:'Order of Reaction'}, {id:'c8-2', name:'Arrhenius Equation'}] },
      { id: 'c12', name: 'Coordination Compounds', sub: [{id:'c12-1', name:'IUPAC & Isomerism'}, {id:'c12-2', name:'Crystal Field Theory'}] },
      { id: 'c13', name: 'GOC', sub: [{id:'c13-1', name:'Electronic Effects (Inductive, Resonance)'}, {id:'c13-2', name:'Reaction Intermediates'}] },
      { id: 'c14', name: 'Hydrocarbons', sub: [{id:'c14-1', name:'Alkanes, Alkenes, Alkynes'}, {id:'c14-2', name:'Aromatic Hydrocarbons'}] },
      { id: 'c16', name: 'Oxygen & Nitrogen Organics', sub: [{id:'c16-1', name:'Alcohols, Phenols, Ethers'}, {id:'c16-2', name:'Aldehydes & Ketones'}, {id:'c16-3', name:'Amines'}] }
  ],
  math: [
      { id: 'm1', name: 'Sets, Relations, Functions', sub: [{id:'m1-1', name:'Types of Relations'}, {id:'m1-2', name:'Domain, Range & Composite Functions'}] },
      { id: 'm2', name: 'Complex Numbers & Quadratics', sub: [{id:'m2-1', name:'Complex Number Algebra'}, {id:'m2-2', name:'Quadratic Equations'}] },
      { id: 'm3', name: 'Matrices & Determinants', sub: [{id:'m3-1', name:'Matrix Operations'}, {id:'m3-2', name:'System of Linear Equations'}] },
      { id: 'm4', name: 'Permutations & Combinations', sub: [{id:'m4-1', name:'P&C Fundamentals'}] },
      { id: 'm5', name: 'Binomial Theorem', sub: [{id:'m5-1', name:'General Term & Coefficients'}] },
      { id: 'm6', name: 'Sequence & Series', sub: [{id:'m6-1', name:'AP, GP & Special Series'}] },
      { id: 'm7', name: 'Limits, Continuity & Diff.', sub: [{id:'m7-1', name:'Limits Evaluation'}, {id:'m7-2', name:'Continuity & Differentiability'}] },
      { id: 'm8', name: 'Integral Calculus', sub: [{id:'m8-1', name:'Indefinite & Definite Integrals'}, {id:'m8-2', name:'Area Under Curve'}] },
      { id: 'm10', name: 'Coordinate Geometry', sub: [{id:'m10-1', name:'Straight Lines'}, {id:'m10-2', name:'Circles'}, {id:'m10-3', name:'Conic Sections'}] },
      { id: 'm11', name: 'Vector & 3D Geometry', sub: [{id:'m11-1', name:'Vector Algebra'}, {id:'m11-2', name:'3D Lines & Planes'}] },
      { id: 'm12', name: 'Statistics & Probability', sub: [{id:'m12-1', name:'Mean & Variance'}, {id:'m12-2', name:'Probability & Bayes Theorem'}] }
  ]
};

const generateMockTests = () => {
  const tests = [];
  for(let i=1; i<=5; i++) tests.push({ id: `oct-${i}`, month: 'oct', title: `Oct Mock Test #${i}`, date: `Oct 2026` });
  for(let i=1; i<=30; i++) tests.push({ id: `nov-${i}`, month: 'nov', title: `Nov Daily Mock Day ${i}`, date: `Nov ${i}, 2026` });
  for(let i=1; i<=31; i++) tests.push({ id: `dec-${i}`, month: 'dec', title: `Dec Daily Mock Day ${i}`, date: `Dec ${i}, 2026` });
  for(let i=1; i<=22; i++) tests.push({ id: `jan-${i}`, month: 'jan', title: `Jan Daily Mock Day ${i}`, date: `Jan ${i}, 2027` });
  return tests;
};
const MOCK_TESTS = generateMockTests();

export { PYQ_YEARS, SYLLABUS_DATA, MOCK_TESTS };
