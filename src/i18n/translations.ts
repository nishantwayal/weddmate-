import { LanguageCode } from '../types';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', rtl: true },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia' },
];

export interface TranslationBundle {
  brand: string;
  navHome: string;
  navDiscover: string;
  navMatches: string;
  navChat: string;
  navProfile: string;
  openApp: string;
  websiteView: string;
  signIn: string;
  signOut: string;
  heroTitle: string;
  heroSubtitle: string;
  joinWithQr: string;
  createWeddingQr: string;
  plannerStudio: string;
  memoriesReels: string;
  like: string;
  pass: string;
  secretCrush: string;
  superLike: string;
  itsAMatch: string;
  startChat: string;
  keepBrowsing: string;
  optInDiscover: string;
  qrExpired: string;
  bridesSide: string;
  groomsSide: string;
  privacyNotice: string;
  downloadQrCard: string;
  saveProfile: string;
  previewProfile: string;
  hideProfile: string;
  pauseMatchmaking: string;
  deleteAccount: string;
}

const EN: TranslationBundle = {
  brand: 'Weddmate',
  navHome: 'Home',
  navDiscover: 'Discover',
  navMatches: 'Matches',
  navChat: 'Chat',
  navProfile: 'Profile',
  openApp: 'Open App',
  websiteView: 'Website',
  signIn: 'Sign In',
  signOut: 'Log Out',
  heroTitle: 'Where Two Families Gather, Meaningful Matches Begin.',
  heroSubtitle:
    'Private, invitation-only wedding communities unlocked by a Heart QR code. Guests voluntarily opt in to discover matches, chat securely after mutual consent, and share wedding memories & reels.',
  joinWithQr: 'Join via Wedding QR',
  createWeddingQr: 'Create Heart QR',
  plannerStudio: 'Planner Studio',
  memoriesReels: 'Memories & Reels',
  like: 'Like',
  pass: 'Pass',
  secretCrush: 'Secret Crush',
  superLike: 'Super Like',
  itsAMatch: "It's a Match!",
  startChat: 'Start Conversation',
  keepBrowsing: 'Keep Discovering',
  optInDiscover: 'Opt in to Wedding Matchmaking',
  qrExpired: 'This Wedding QR has expired',
  bridesSide: "Bride's Side",
  groomsSide: "Groom's Side",
  privacyNotice:
    'Attending the same wedding does not verify background. Profiles stay private unless you explicitly opt in.',
  downloadQrCard: 'Download Heart QR Card',
  saveProfile: 'Save Profile',
  previewProfile: 'Preview Profile',
  hideProfile: 'Hide Profile',
  pauseMatchmaking: 'Pause Matchmaking',
  deleteAccount: 'Delete Account',
};

const TRANSLATIONS: Record<LanguageCode, Partial<TranslationBundle>> = {
  en: EN,
  hi: {
    navHome: 'होम',
    navDiscover: 'खोजें',
    navMatches: 'मैच',
    navChat: 'चैट',
    navProfile: 'प्रोफ़ाइल',
    openApp: 'ऐप खोलें',
    websiteView: 'वेबसाइट',
    signIn: 'साइन इन',
    signOut: 'लॉग आउट',
    heroTitle: 'जहाँ दो परिवार मिलते हैं, वहीं सच्चे रिश्ते शुरू होते हैं।',
    heroSubtitle:
      'हार्ट QR कोड से खुलने वाला निजी विवाह समुदाय। मेहमान अपनी सहमति से मैचमेकिंग चुनते हैं, आपसी पसंद पर सुरक्षित चैट करते हैं, और शादी की यादें व रील्स साझा करते हैं।',
    joinWithQr: 'शादी QR से जुड़ें',
    createWeddingQr: 'हार्ट QR बनाएं',
    plannerStudio: 'प्लानर स्टूडियो',
    memoriesReels: 'यादें और रील्स',
    like: 'पसंद',
    pass: 'आगे बढ़ें',
    secretCrush: 'सीक्रेट क्रश',
    superLike: 'सुपर लाइक',
    itsAMatch: 'यह एक मैच है!',
    startChat: 'बातचीत शुरू करें',
    keepBrowsing: 'खोजना जारी रखें',
    optInDiscover: 'मैचमेकिंग में स्वेच्छा से शामिल हों',
    qrExpired: 'इस शादी का QR समाप्त हो चुका है',
    bridesSide: 'वधू पक्ष',
    groomsSide: 'वर पक्ष',
    downloadQrCard: 'हार्ट QR कार्ड डाउनलोड करें',
    saveProfile: 'प्रोफ़ाइल सहेजें',
    previewProfile: 'प्रोफ़ाइल पूर्वावलोकन',
    hideProfile: 'प्रोफ़ाइल छिपाएं',
    pauseMatchmaking: 'मैचमेकिंग रोकें',
    deleteAccount: 'खाता हटाएं',
  },
  ur: {
    navHome: 'ہوم',
    navDiscover: 'تلاش',
    navMatches: 'میچز',
    navChat: 'چیٹ',
    navProfile: 'پروفائل',
    openApp: 'ایپ کھولیں',
    websiteView: 'ویب سائٹ',
    signIn: 'سائن ان',
    signOut: 'لاگ آؤٹ',
    heroTitle: 'جہاں دو خاندان ملتے ہیں، وہیں بامعنی رشتوں کا آغاز ہوتا ہے۔',
    heroSubtitle:
      'ہارٹ QR کوڈ سے جڑنے والی نجی شادی کمیونٹی۔ مہمان اپنی مرضی سے میچ میکنگ میں شامل ہوتے ہیں، باہمی پسند پر محفوظ چیٹ کرتے ہیں، اور یادیں شیئر کرتے ہیں۔',
    joinWithQr: 'شادی QR سے شامل ہوں',
    createWeddingQr: 'ہارٹ QR بنائیں',
    plannerStudio: 'پلانر اسٹوڈیو',
    memoriesReels: 'یادیں اور ریلز',
    like: 'پسند',
    pass: 'اگلا',
    secretCrush: 'خفیہ پسند',
    superLike: 'سپر لائک',
    itsAMatch: 'میچ ہو گیا!',
    startChat: 'گفتگو شروع کریں',
    keepBrowsing: 'تلاش جاری رکھیں',
    optInDiscover: 'میچ میکنگ میں شامل ہوں',
    qrExpired: 'اس شادی کا QR ختم ہو چکا ہے',
    bridesSide: 'دلہن کی طرف',
    groomsSide: 'دولہے کی طرف',
    downloadQrCard: 'ہارٹ QR کارڈ ڈاؤن لوڈ کریں',
    saveProfile: 'پروفائل محفوظ کریں',
    previewProfile: 'پروفائل دیکھیں',
    hideProfile: 'پروفائل چھپائیں',
    pauseMatchmaking: 'میچ میکنگ روکیں',
    deleteAccount: 'اکاؤنٹ حذف کریں',
  },
  mr: {
    navHome: 'होम',
    navDiscover: 'शोधा',
    navMatches: 'मॅचेस',
    navChat: 'चॅट',
    navProfile: 'प्रोफाइल',
    openApp: 'अॅप उघडा',
    signIn: 'साइन इन',
    signOut: 'लॉग आउट',
    heroTitle: 'जिथे दोन कुटुंबे एकत्र येतात, तिथेच सुंदर नात्यांची सुरुवात होते.',
    joinWithQr: 'लग्न QR ने सामील व्हा',
    createWeddingQr: 'हार्ट QR तयार करा',
    plannerStudio: 'प्लॅनर स्टुडिओ',
    memoriesReels: 'आठवणी आणि रील्स',
    like: 'आवडले',
    pass: 'पुढे',
    secretCrush: 'सीक्रेट क्रश',
    itsAMatch: 'मॅच झाले!',
    bridesSide: 'वधू पक्ष',
    groomsSide: 'वर पक्ष',
  },
  gu: {
    navHome: 'હોમ',
    navDiscover: 'શોધો',
    navMatches: 'મેચ',
    navChat: 'ચેટ',
    navProfile: 'પ્રોફાઇલ',
    openApp: 'એપ ખોલો',
    signIn: 'સાઇન ઇન',
    signOut: 'લોગ આઉટ',
    heroTitle: 'જ્યાં બે પરિવાર મળે છે, ત્યાં અર્થપૂર્ણ સંબંધોની શરૂઆત થાય છે.',
    joinWithQr: 'લગ્ન QR થી જોડાઓ',
    createWeddingQr: 'હાર્ટ QR બનાવો',
    plannerStudio: 'પ્લાનર સ્ટુડિયો',
    memoriesReels: 'યાદો અને રીલ્સ',
    like: 'પસંદ',
    pass: 'આગળ',
    secretCrush: 'સીક્રેટ ક્રશ',
    itsAMatch: 'મેચ થયું!',
    bridesSide: 'કન્યા પક્ષ',
    groomsSide: 'વર પક્ષ',
  },
  pa: {
    navHome: 'ਹੋਮ',
    navDiscover: 'ਖੋਜੋ',
    navMatches: 'ਮੈਚ',
    navChat: 'ਚੈਟ',
    navProfile: 'ਪ੍ਰੋਫਾਈਲ',
    openApp: 'ਐਪ ਖੋਲ੍ਹੋ',
    signIn: 'ਸਾਈਨ ਇਨ',
    signOut: 'ਲਾਗ ਆਉਟ',
    heroTitle: 'ਜਿੱਥੇ ਦੋ ਪਰਿਵਾਰ ਮਿਲਦੇ ਹਨ, ਉੱਥੇ ਸੱਚੇ ਰਿਸ਼ਤੇ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹਨ।',
    joinWithQr: 'ਵਿਆਹ QR ਨਾਲ ਜੁੜੋ',
    createWeddingQr: 'ਹਾਰਟ QR ਬਣਾਓ',
    plannerStudio: 'ਪਲੈਨਰ ਸਟੂਡੀਓ',
    memoriesReels: 'ਯਾਦਾਂ ਅਤੇ ਰੀਲਜ਼',
    like: 'ਪਸੰਦ',
    pass: 'ਅੱਗੇ',
    secretCrush: 'ਸੀਕ੍ਰੇਟ ਕ੍ਰਸ਼',
    itsAMatch: 'ਮੈਚ ਹੋ ਗਿਆ!',
    bridesSide: 'ਲਾੜੀ ਪੱਖ',
    groomsSide: 'ਲਾੜਾ ਪੱਖ',
  },
  ta: {
    navHome: 'முகப்பு',
    navDiscover: 'கண்டறி',
    navMatches: 'பொருத்தங்கள்',
    navChat: 'உரையாடல்',
    navProfile: 'சுயவிவரம்',
    openApp: 'செயலியை திற',
    signIn: 'உள்நுழைக',
    signOut: 'வெளியேறு',
    heroTitle: 'இரு குடும்பங்கள் இணையும் இடத்தில் அழகிய உறவுகள் தொடங்குகின்றன.',
    joinWithQr: 'திருமண QR மூலம் இணைக',
    createWeddingQr: 'ஹார்ட் QR உருவாக்கு',
    plannerStudio: 'பிளானர் ஸ்டுடியோ',
    memoriesReels: 'நினைவுகள் & ரீல்ஸ்',
    like: 'விருப்பம்',
    pass: 'தவிர்',
    secretCrush: 'ரகசிய விருப்பம்',
    itsAMatch: 'பொருத்தம் கிடைத்தது!',
    bridesSide: 'மணமகள் தரப்பு',
    groomsSide: 'மணமகன் தரப்பு',
  },
  te: {
    navHome: 'హోమ్',
    navDiscover: 'కనుగొనండి',
    navMatches: 'మ్యాచ్‌లు',
    navChat: 'చాట్',
    navProfile: 'ప్రొఫైల్',
    openApp: 'యాప్ తెరవండి',
    signIn: 'సైన్ ఇన్',
    signOut: 'లాగ్ అవుట్',
    heroTitle: 'రెండు కుటుంబాలు కలిసే చోటే అందమైన బంధాలు మొదలవుతాయి.',
    joinWithQr: 'పెళ్లి QR ద్వారా చేరండి',
    createWeddingQr: 'హార్ట్ QR సృష్టించండి',
    plannerStudio: 'ప్లానర్ స్టూడియో',
    memoriesReels: 'జ్ఞాపకాలు & రీల్స్',
    like: 'లైక్',
    pass: 'దాటవేయి',
    secretCrush: 'సీక్రెట్ క్రష్',
    itsAMatch: 'మ్యాచ్ కుదిరింది!',
    bridesSide: 'వధువు వైపు',
    groomsSide: 'వరుడు వైపు',
  },
  kn: {
    navHome: 'ಮುಖಪುಟ',
    navDiscover: 'ಹುಡುಕಿ',
    navMatches: 'ಮ್ಯಾಚ್‌ಗಳು',
    navChat: 'ಚಾಟ್',
    navProfile: 'ಪ್ರೊಫೈಲ್',
    openApp: 'ಆ್ಯಪ್ ತೆರೆಯಿರಿ',
    signIn: 'ಸೈನ್ ಇನ್',
    signOut: 'ಲಾಗ್ ಔಟ್',
    heroTitle: 'ಎರಡು ಕುಟುಂಬಗಳು ಸೇರುವಲ್ಲೇ ಸುಂದರ ಸಂಬಂಧಗಳು ಆರಂಭವಾಗುತ್ತವೆ.',
    joinWithQr: 'ಮದುವೆ QR ಮೂಲಕ ಸೇರಿ',
    createWeddingQr: 'ಹಾರ್ಟ್ QR ರಚಿಸಿ',
    plannerStudio: 'ಪ್ಲಾನರ್ ಸ್ಟುಡಿಯೋ',
    memoriesReels: 'ನೆನಪುಗಳು ಮತ್ತು ರೀಲ್ಸ್',
    like: 'ಇಷ್ಟ',
    pass: 'ಮುಂದೆ',
    secretCrush: 'ಸೀಕ್ರೆಟ್ ಕ್ರಶ್',
    itsAMatch: 'ಮ್ಯಾಚ್ ಆಗಿದೆ!',
    bridesSide: 'ವಧುವಿನ ಕಡೆ',
    groomsSide: 'ವರನ ಕಡೆ',
  },
  ml: {
    navHome: 'ഹോം',
    navDiscover: 'കണ്ടെത്തുക',
    navMatches: 'മാച്ചുകൾ',
    navChat: 'ചാറ്റ്',
    navProfile: 'പ്രൊഫൈൽ',
    openApp: 'ആപ്പ് തുറക്കുക',
    signIn: 'സൈൻ ഇൻ',
    signOut: 'ലോഗ് ഔട്ട്',
    heroTitle: 'രണ്ട് കുടുംബങ്ങൾ ഒന്നിക്കുന്നിടത്ത് മനോഹര ബന്ധങ്ങൾ തുടങ്ങുന്നു.',
    joinWithQr: 'വിവാഹ QR വഴി ചേരുക',
    createWeddingQr: 'ഹാർട്ട് QR നിർമ്മിക്കുക',
    plannerStudio: 'പ്ലാനർ സ്റ്റുഡിയോ',
    memoriesReels: 'ഓർമ്മകളും റീലുകളും',
    like: 'ഇഷ്ടം',
    pass: 'മാറ്റുക',
    secretCrush: 'സീക്രട്ട് ക്രഷ്',
    itsAMatch: 'മാച്ച് ആയി!',
    bridesSide: 'വധുവിന്റെ ഭാഗം',
    groomsSide: 'വരന്റെ ഭാഗം',
  },
  bn: {
    navHome: 'হোম',
    navDiscover: 'খুঁজুন',
    navMatches: 'ম্যাচ',
    navChat: 'চ্যাট',
    navProfile: 'প্রোফাইল',
    openApp: 'অ্যাপ খুলুন',
    signIn: 'সাইন ইন',
    signOut: 'লগ আউট',
    heroTitle: 'যেখানে দুই পরিবার মিলিত হয়, সেখানেই নতুন সম্পর্কের সূচনা।',
    joinWithQr: 'বিয়ের QR দিয়ে যোগ দিন',
    createWeddingQr: 'হার্ট QR তৈরি করুন',
    plannerStudio: 'প্ল্যানার স্টুডিও',
    memoriesReels: 'স্মৃতি ও রিলস',
    like: 'পছন্দ',
    pass: 'এগিয়ে যান',
    secretCrush: 'সিক্রেট ক্রাশ',
    itsAMatch: 'ম্যাচ হয়েছে!',
    bridesSide: 'কনের পক্ষ',
    groomsSide: 'বরের পক্ষ',
  },
  or: {
    navHome: 'ହୋମ୍',
    navDiscover: 'ଖୋଜନ୍ତୁ',
    navMatches: 'ମ୍ୟାଚ୍',
    navChat: 'ଚାଟ୍',
    navProfile: 'ପ୍ରୋଫାଇଲ୍',
    openApp: 'ଆପ୍ ଖୋଲନ୍ତୁ',
    signIn: 'ସାଇନ୍ ଇନ୍',
    signOut: 'ଲଗ୍ ଆଉଟ୍',
    heroTitle: 'ଯେଉଁଠି ଦୁଇ ପରିବାର ମିଳନ୍ତି, ସେଇଠି ସୁନ୍ଦର ସମ୍ପର୍କର ଆରମ୍ଭ ହୁଏ ।',
    joinWithQr: 'ବିବାହ QR ସହ ଯୋଗ ଦିଅନ୍ତୁ',
    createWeddingQr: 'ହାର୍ଟ QR ତିଆରି କରନ୍ତୁ',
    plannerStudio: 'ପ୍ଲାନର ଷ୍ଟୁଡିଓ',
    memoriesReels: 'ସ୍ମୃତି ଏବଂ ରିଲ୍ସ',
    like: 'ପସନ୍ଦ',
    pass: 'ଆଗକୁ',
    secretCrush: 'ସିକ୍ରେଟ୍ କ୍ରସ୍',
    itsAMatch: 'ମ୍ୟାଚ୍ ହୋଇଗଲା!',
    bridesSide: 'କନ୍ୟା ପକ୍ଷ',
    groomsSide: 'ବର ପକ୍ଷ',
  },
};

export function t(lang: LanguageCode): TranslationBundle {
  return { ...EN, ...(TRANSLATIONS[lang] || {}) };
}

export function isRtlLanguage(lang: LanguageCode): boolean {
  return lang === 'ur';
}
