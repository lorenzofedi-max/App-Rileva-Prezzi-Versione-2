import { SupplierRule } from './types';

export const STORE_CHAINS = [
  "Aldi", "Alleanza 3.0", "Brico Io", "Brico OK", "Bricocenter", "Bricofer",
  "Carrefour", "CFadda", "Conad", "Coop Etruria", "Coop fi", "Esselunga",
  "Eurospin", "IKEA", "Leroy Merlin", "Lidl", "OBI", "Pam", "Penny",
  "Tigros", "Viridea"
];

export const PLANTS = [
  "Abete", "Aechmea", "Agrifoglio", "Agrume", "Alberi da frutto", "Alga palla",
  "Anthurium", "Aptenia", "Arbusti da siepe", "Aromatiche", "Azalea", "Basilico",
  "Begonia", "Bromelia", "Bulbi", "Cactus", "Calathea", "Calluna", "Camelia",
  "Campanula", "Cavolo ornamentale", "Celosia", "Ciclamino", "Cocus nocifera",
  "Crisantemo", "Cupressus", "Cycas", "Dipladenia", "Dracaena", "Edera",
  "Erba gatto", "Erica", "Euonymus", "Euphorbia milii", "Felce", "Ficus ginseng",
  "Ficus robusta", "Fragola", "Gardenia", "Garofano", "Gelsomino", "Geranio",
  "Gerbera", "Guzmania", "Hebe", "Helleborus", "Kalanchoe", "Kentia", "Lavanda",
  "Limone", "Monstera", "Orchidea", "Ortensia", "Pachira", "Peonia", "Petunia",
  "Phalaenopsis", "Pino", "Portulaca", "Pothos", "Primula", "Rosa", "Sansevieria",
  "Spathiphyllum", "Stella di Natale", "Strelitzia", "Succulenta", "Surfinia",
  "Ulivo", "Vriesea", "Yucca", "Zamioculcas"
];

export const CUT_FLOWERS = [
  "Alstroemerie", "Amarilli", "Anemoni", "Anthurium", "Bq. misto grande",
  "Bq. misto medio", "Bq. misto piccolo", "Calle", "Crisantemi", "Eucalipto",
  "Fresie", "Garofani", "Gerbere", "Girasoli", "Gladioli", "Ilex", "Iris",
  "Lilium", "Lisianthus", "Lucky Bamboo", "Orchidee Cymbidium", "Peonie",
  "Ranuncoli", "Rose", "Rose solidal", "Ruscus", "Solidago", "Strelitzie",
  "Tulipani"
];

export const STORE_NAMES = [
  "Altopascio", "Arancio", "Campi Bisenzio", "Cascina", "Empoli", "Firenze",
  "Follonica", "Grosseto", "Livorno", "Lucca", "Monsummano", "Montecatini",
  "Pescia", "Piombino", "Pisa", "Pistoia", "Pontedera", "Porcari",
  "San Concordio", "Scandicci", "Sesto Fiorentino", "Viareggio"
];

export const SUPPLIERS = [
  "Baldi", "Bregliano", "Eurofresh", "Fitimex", "Flora Toscana", "Floragro",
  "Giromagi", "Global Plant", "Losiflores", "Maffucci", "Medici", "Morotti",
  "Osioflor", "Pagano", "Pastor", "PD Plants", "Procoflora", "Sangiorgio"
];

export const VASE_DIAMETERS = [
  "6", "7", "9", "10", "10.5", "11", "12", "13", "14", "15", "16", "17",
  "18", "19", "20", "21", "22", "24", "26", "28", "30"
];

export const STEM_COUNTS = [
  "1", "3", "5", "7", "9", "10", "12", "15", "20", "25"
];

export const SUPPLIER_EAN_RULES: SupplierRule[] = [
  { root: '8003568', supplier: 'Fitimex' },
  { root: '8008638', supplier: 'Eurofresh' },
  { root: '8010896', supplier: 'Baldi' },
  { root: '8013129', supplier: 'Bregliano' },
  { root: '8013451', supplier: 'Pastor Luigi' },
  { root: '8019134', supplier: 'Losiflores' },
  { root: '8021790', supplier: 'Sangiorgio' },
  { root: '8023654', supplier: 'Osioflor' },
  { root: '8024278', supplier: 'Morotti' },
  { root: '8025761', supplier: 'Flora Toscana' },
  { root: '8027204', supplier: 'Maffucci' },
  { root: '8719548', supplier: 'Procoflora' },
  { root: '803261051', supplier: 'Floragro' },
  { root: '805004331', supplier: 'Maffucci' },
  { root: '805127778', supplier: 'PD Plants' },
  { root: '805534828', supplier: 'Pagano' },
  { root: '805772306', supplier: 'Medici' },
  { root: '805804573', supplier: 'PD Plants' },
  { root: '805809362', supplier: 'Pagano' },
  { root: '871912803', supplier: 'Procoflora' }
];
