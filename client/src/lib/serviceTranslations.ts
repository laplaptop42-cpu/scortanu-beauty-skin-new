import { translations } from './translations';

// Map service names to translation keys
const serviceNameMap: Record<string, string> = {
  'Microblading': 'microblading',
  'Acne Treatment': 'acneTreatment',
  'Carbon Peel Laser': 'carbonPeel',
  'Dermopigmentation': 'dermopigmentation',
  'Facial Rejuvenation': 'facialRejuvenation',
  'Jawline Contouring': 'jawlineContouring',
  'Lip Micropigmentation': 'lipMicropigmentation',
  'Lip Shape Correction': 'lipShapeCorrection',
  'Melasma Treatment': 'melasmaTreatment',
  'Lip Volumization': 'lipVolumization',
  'Nasolabial Folds': 'nasolabialFolds',
  'Nose Shape Correction': 'noseShapeCorrection',
  'Permanent Make-up': 'permanentMakeup',
  'Plasma Lift': 'plasmaLift',
  'Radiofrequency Microneedling': 'radiofrequencyMicroneedling',
  'Rhinofiller': 'rhinofiller',
  'Russian Lips': 'russianLips',
  'Skin Booster': 'skinBooster',
};

// Map course names to translation keys
const courseNameMap: Record<string, string> = {
  'Hyaluron Pen Lip Volume Kit included': 'hyaluronPenKitIncluded',
  'Corrective Morphology': 'correctiveMorphology',
  'Dermopigmentation': 'dermopigmentationCourse',
  'Microblading Course Eyebrows Without KIT': 'microbladingWithoutKit',
  'Hyaluron Pen Lip Volume Without Kit': 'hyaluronPenWithoutKit',
  'Hyaluron pen course for other areas. including KIT': 'hyaluronPenOtherAreasWithKit',
  'Hyaluron pen course for other areas. Without KIT': 'hyaluronPenOtherAreasWithoutKit',
  "Microblading course for men's eyebrows, realistic technique, without KIT": 'microbladingMensWithoutKit',
  "Microblading course for men's eyebrows, realistic technique, including KIT": 'microbladingMensWithKit',
  'Microblading Advanced Course for Womens': 'microbladingAdvancedWomens',
};

export function getServiceTranslation(
  serviceName: string,
  language: 'en' | 'de' | 'it' | 'fr',
  type: 'name' | 'description' = 'name'
): string {
  const key = serviceNameMap[serviceName];
  if (!key) return serviceName;

  const translationKey = type === 'description' ? `${key}Desc` : key;
  const langTranslations = translations[language];
  
  return (langTranslations[translationKey as keyof typeof langTranslations] as string) || serviceName;
}

export function getCourseTranslation(
  courseName: string,
  language: 'en' | 'de' | 'it' | 'fr',
  type: 'name' | 'description' = 'name'
): string {
  const key = courseNameMap[courseName];
  if (!key) return courseName;

  const translationKey = type === 'description' ? `${key}Desc` : key;
  const langTranslations = translations[language];
  
  return (langTranslations[translationKey as keyof typeof langTranslations] as string) || courseName;
}
