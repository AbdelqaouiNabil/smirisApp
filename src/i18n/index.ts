import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// Import translations
import frCommon from './locales/fr/common.json'
import frNavigation from './locales/fr/navigation.json'
import frHomepage from './locales/fr/homepage.json'
import frCourses from './locales/fr/courses.json'
import frTutors from './locales/fr/tutors.json'
import frSchools from './locales/fr/schools.json'
import frVisa from './locales/fr/visa.json'
import frDashboard from './locales/fr/dashboard.json'
import frRegistration from './locales/fr/registration.json'

import arCommon from './locales/ar/common.json'
import arNavigation from './locales/ar/navigation.json'
import arHomepage from './locales/ar/homepage.json'
import arCourses from './locales/ar/courses.json'
import arTutors from './locales/ar/tutors.json'
import arSchools from './locales/ar/schools.json'
import arVisa from './locales/ar/visa.json'
import arDashboard from './locales/ar/dashboard.json'
import arRegistration from './locales/ar/registration.json'

const resources = {
  fr: {
    common: frCommon,
    navigation: frNavigation,
    homepage: frHomepage,
    courses: frCourses,
    tutors: frTutors,
    schools: frSchools,
    visa: frVisa,
    dashboard: frDashboard,
    registration: frRegistration
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    homepage: arHomepage,
    courses: arCourses,
    tutors: arTutors,
    schools: arSchools,
    visa: arVisa,
    dashboard: arDashboard,
    registration: arRegistration
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'germansphere_language',
      caches: ['localStorage']
    },
    
    react: {
      useSuspense: false
    }
  })

export default i18n
