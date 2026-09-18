import { sources } from './sources.mjs';

// These are glossary references. Existing article editions retain their own source snapshots.
const records = [];
const aliases = new Map();
function add(ids, title, author, url, locator, access = '검색 발췌 확인', license = '참고·독자 정의') {
  const names = ids.split(';');
  const record = { id: names[0], title, author, url, locator, access, license, checkedAt: '2026-09-18' };
  records.push(record);
  names.forEach(id => aliases.set(id, record.id));
}
for (const s of sources.filter(s => s.id !== 'llmwiki')) { records.push({ ...s }); aliases.set(s.id, s.id); }
for (const letter of 'ABCDEFGHILMOPQRSTUVY') {
  add(`sky-${letter.toLowerCase()}`, `Skyscript 용어집 — ${letter}`, 'Deborah Houlding / Skyscript', `https://www.skyscript.co.uk/glossary/${letter}`, `${letter} 표제어 색인과 관련 정의. 개별 저자의 상이한 규칙은 원문을 우선한다.`, 'ADFHLMPR'.includes(letter) ? '용어집 본문 확인' : '용어집 색인 참고', 'CC BY-NC-SA 4.0');
}
add('usno', 'Astronomical Almanac: Glossary', 'US Naval Observatory', 'https://aa.usno.navy.mil/faq/asa_glossary', '좌표·시각·천체 운동의 천문학적 정의', '본문 확인');
add('iana-time', 'Time Zone Database', 'IANA', 'https://www.iana.org/time-zones', '역사적 표준시·일광절약시간 데이터');
add('jpl-bodies', 'Small-Body Database', 'NASA / JPL', 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html', '실제 소천체의 명칭·번호·궤도 검색');
const help = (id, name, code) => add(id, `Astrodienst: ${name}`, 'Astrodienst', `https://www.astro.com/cgi/h.cgi?f=gch&h=${code}&lang=e`, '계산 방식 및 선택 항목 설명', '도움말 본문 확인');
help('chart-types', 'Chart types', 'gchrtype');
help('synastry', 'Synastry', 'gch61'); help('composite', 'Composite', 'gch621'); help('davison', 'Davison relationship chart', 'gch65');
help('tertiary', 'Tertiary progressions', 'gch254'); help('minor', 'Minor progressions', 'gch258');
help('progressed-composite-help;directions-keys', 'Composite and progressions / angle keys', 'gch6251');
help('harmonic-help', 'Harmonic charts', 'gch29'); help('relocation-help', 'Relocation chart', 'gch22');
help('local-space-help', 'Local Space chart', 'gch2als'); help('draconic', 'Draconic chart', 'gch202');
add('lilith', 'Lilith', 'Astrodienst Astrowiki 편집자', 'https://www.astro.com/astrowiki/en/Lilith', '원지점·소행성 1181·가상 다크문 구별');
add('rodden', 'Rodden Rating', 'Astro-Databank', 'https://www.astro.com/astro-databank/Help:RR', '출생자료 등급과 근거 설명');
add('lilly', 'Christian Astrology (1647)', 'William Lilly', 'https://archive.org/details/b30338724', '원전 판본 안내. 이 용어집의 세부 정의는 함께 연결한 용어집·연구를 참조한다.', '서지 확인; 전권 대조 미완료', 'Public domain 원전');
add('gansten-directions', 'Primary Directions — Chapter 1', 'Martin Gansten', 'https://www.skyscript.co.uk/pdf/PD_Skyscript_extract_ch1.pdf', '일주운동, 프라이머리 디렉션의 개념과 용어', '공개 발췌 본문 확인');
add('brennan-joys', 'Planetary joys — What House Rules Sex in Western Astrology?', 'Chris Brennan', 'https://theastrologypodcast.com/transcripts/ep-157-transcript-what-house-rules-sex-in-western-astrology/', '행성의 기쁨과 하우스 배당을 열거하는 대화 부분');

add('hellenistic-conditions;hellenistic-texts', 'Demetra George on Ancient Astrology in Theory and Practice', 'Demetra George / Chris Brennan', 'https://theastrologypodcast.com/transcripts/ep-188-demetra-george-on-ancient-astrology-in-theory-and-practice/', 'maltreatment, spear-bearing 및 원전 해석 이견');
add('hermetic-lots', 'The Theoretical Rationale Underlying the Seven Hermetic Lots', 'Chris Brennan', 'https://theastrologypodcast.com/wp-content/uploads/2019/10/tradition-journal-vol-2.pdf', 'The Tradition 2 (2009), 일곱 헤르메스 랏 논문');
add('master-nativity', 'The Master of the Nativity', 'Chris Brennan / guests', 'https://theastrologypodcast.com/transcripts/ep-205-transcript-the-master-of-the-nativity/', 'predominator, oikodespotes, kurios의 구별');
add('valens-summary', 'Vettius Valens: Anthology — contents and summaries', 'Project Hindsight', 'https://projecthindsight.com/products/greek%20summaries/valens.html', '발렌스의 기간 기법에 관한 권별 개요', '목차·요약 확인');
add('quarters', 'Quarters of the Moon', 'Delphic Oracle / Astrology X Files', 'https://astrology-x-files.com/help-do4/qtrsmoon.html', '달의 사분기 기간법의 소프트웨어 구현 설명');
add('rudhyar', 'Dane Rudhyar: Astrological writings', 'Dane Rudhyar / Khaldea', 'https://www.khaldea.com/rudhyar/astrology.shtml', '인본주의·초개인 점성술 저작 목록과 공개 저술', '저작 목록 확인');
add('cpa', 'Centre for Psychological Astrology', 'CPA', 'https://cpalondon.com/', '심리 점성술 교육 기관의 자기 설명', '소개 본문 확인');
add('evolutionary', 'About the School of Evolutionary Astrology', 'Jeffrey Wolf Green School', 'https://schoolofevolutionaryastrology.com/about/', '해당 학파의 명왕성·영혼 진화 접근. 효능은 학파의 주장이다.');
add('archetypal', 'The Planets', 'Richard Tarnas', 'https://archai.org/article-posts/the-planets/', 'Archai 1 (2009), 행성 원형에 대한 저자의 설명');
add('bailey', 'Esoteric Astrology', 'Alice A. Bailey / Lucis Trust', 'https://www.lucistrust.org/store/item/esoteric_astrology_hc', '저자·목차·사상적 범위', '출판사 소개·목차 확인');
add('jones-patterns', 'Sabian Astrology Q&A — Temperament Types', 'Sabian Assembly', 'https://sabian.org/sabian_astrology_qa1.php', 'Marc Edmund Jones의 일곱 차트 패턴');
add('sabian', 'The Interpretation of a Horoscope', 'Marc Edmund Jones', 'https://sabian.org/horoscope_interpretation.php', '사비안 심벌의 사용과 1931/1953 판본 차이');
add('huber-age', 'Astrology Tips — Understanding Life’s Journey', 'Joyce Hopewell / Astrological Psychology', 'https://astrologicalpsychology.org/wp-content/uploads/2023/12/3070c-astrology_tips.pdf', 'Tip 10, Age Progression');
add('huber-aspects', 'Aspect Pattern Astrology', 'Bruno, Louise and Michael Huber', 'https://astrologicalpsychology.org/books/huber-books/aspect-pattern-astrology-2/', '허버 학파의 애스펙트 패턴 접근', '출판사 소개 확인');
add('huber-nodes', 'Moon Node Astrology', 'Bruno and Louise Huber', 'https://astrologicalpsychology.org/books/huber-books/moon-node-astrology/', '출생·하우스·노드 차트의 구별', '출판사 소개 확인');
add('uranian', 'Uranian Astrology', 'David Cochrane', 'https://www.astrosoftware.com/cpnew/a_and_v/uranian_astrology.html', '미드포인트·다이얼·행성 그림의 설명', '본문 확인');
add('uranian-society', 'Uranian Astrology Resources', 'Uranian Society', 'https://uraniansociety.com/?page_id=54', '학파의 저작·자료 목록', '자료 목록 확인');
add('vibrational', 'Research in Vibrational Astrology', 'David Cochrane / Cosmic Patterns', 'https://www.astrosoftware.com/cpnew/m/a_and_v/research_va.html', '연구자가 설명한 하모닉·진동 점성술. 성능 입증과 구별한다.');
add('cosmodynes', 'Cosmodynes', 'Allen Edwall', 'https://astrowin.org/cosmodynes.php', 'Elbert Benjamine 및 W. M. A. Drake의 수치화 체계', '본문 확인');
add('mundane', 'Mundane Astrology', 'Skyscript', 'https://www.skyscript.co.uk/glossary/M', '문데인 관련 표제어; 구체적인 시대·저자별 규칙은 별도 대조', '용어집 본문 확인', 'CC BY-NC-SA 4.0');
add('casebooks', 'Early modern astrology', 'Lauren Kassell et al. / University of Cambridge', 'https://casebooks.lib.cam.ac.uk/astrological-medicine/early-modern-astrology', 'Forman·Napier 사례집 연구');
add('agrippa', 'Three Books of Occult Philosophy, I.32', 'Cornelius Agrippa / Christopher Warnock 전재', 'https://www.renaissanceastrology.com/agrippafixedstarrulership.html', '항성에 배당하는 물질·상징. 원전의 주장으로 읽는다.', '원전 발췌 확인');
add('stars', 'Fixed Stars in Astrology — Research', 'Bernadette Brady', 'https://www.bernadettebrady.com/research/', '항성·파란 접근의 연구자 설명. 모든 항성 규칙을 검증한 목록은 아니다.');
add('acg-learning', 'Astro*Carto*Graphy resources and products', 'Continuum / Jim Lewis 전승', 'https://continuumacg.net/products.html', 'ACG·CCG 자료 및 저작 목록', '자료 목록 확인');
add('geodetic', 'Geodetic Maps and Christopher Nolan’s Chart', 'Julija Simas', 'https://www.astro.com/astrology/tl_article260805_e.htm', '지리 경도와 MC를 대응시키는 규약');
add('rao-book;bala;avastha;ashtakavarga;panchanga;prashna', 'Vedic Astrology: An Integrated Approach', 'P. V. R. Narasimha Rao', 'https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf', '2000 교재 및 저자의 2010 주의문. 정의·목차 참고; 전권 교감은 아니다.', '공개 교재 일부·목차 확인');
add('bphs-basic;bphs-arudha;bphs-karaka;bphs-yoga;bphs-dasha;bphs-transit;bphs-remedies;rath-drishti', 'Bṛhat Parāśara Horā Śāstra', '전승상 Parāśara / Sanskrit Documents', 'https://sanskritdocuments.org/sanskrit/brihatparashara/', '행성·사인·바르가·아루다·카라카·다샤 등의 장별 원문 안내. 판본별 장 번호가 다를 수 있다.', '원문 목록 확인; 전권 교감 미완료');
add('varga;rath-books', 'Varga Chakra and other books', 'Sanjay Rath', 'https://srath.com/misc/varga-chakra/', '바르가별 논의의 목차', '저자 소개·목차 확인');
add('rath-narayana', 'Nārāyaṇa Daśā', 'Sanjay Rath', 'https://srath.com/misc/naraya%E1%B9%87a-dasa/', '저자가 설명하는 사인 다샤 접근');
add('tajika-full', 'The Jewel of Annual Astrology: A Parallel Sanskrit-English Critical Edition of Balabhadra’s Hāyanaratna', 'Martin Gansten (ed. / trans.)', 'https://brill.com/display/book/9789004433717/9789004433717_webready_content_text.pdf', '타지카·연간 차트·기간법·비평판 용어. 전권 원전 대조 완료를 뜻하지 않는다.', '서지·목차·공개 발췌 확인', 'CC BY 4.0');
add('kp', 'An Insight about Astrology and KP Astrology', 'S. Babu Rao / JASA', 'https://www.universalcollegeofastrology.com/An-insight-about-Astrology-and-KP-Astrology.pdf', 'KP의 star-lord, sub-lord 및 시그니피케이터 설명');
add('kp-ruling', 'About Ruling Planets', 'KP Astrology', 'https://www.kpastrology.com/aboutrulingplanets.html', '실천가가 사용하는 ruling planets 규칙');
add('nadi', 'Nāḍī Divination and Indian Astrology', 'Martin Gansten', 'https://www.martingansten.com/pdf/NadiDivinationAndIndianAstrology2011.pdf', '2011 연구; 나디 문헌·점복과 점성술의 관계');
add('lal-kitab', 'Samudrik Commandments: Lal Kitab (1939 edition)', 'Rajiv Mahajan (trans.)', 'https://store.pothi.com/book/rajiv-mahajan-samudrik-commandments-lal-kitab-1939-edition/', '랄 키타브 판본과 번역서 안내', '번역자·출판 소개 확인');
add('chinese-horoscopy', 'Chinese and English Horoscopy in the Sixteenth and Seventeenth Centuries', 'Jeffrey Kotyk', 'https://brill.com/view/journals/ijdp/1/1/article-p3_2.xml', 'IJDP 1 (2019), 3–35. 『성학대성』과 Lilly의 하우스·포르투나 비교', '논문 초록 확인');
aliases.set('guolao', 'xingming');
add('chinese-divination', 'Chinese Mathematical Astrology: Reaching Out to the Stars', 'Ho Peng Yoke', 'https://www.routledge.com/Chinese-Mathematical-Astrology-Reaching-Out-to-the-Stars/Yoke/p/book/9780415863100', '태을·기문둔갑·육임의 역사와 절차', '출판사 소개·목차 확인');
add('bazi', '三命通會 — 四庫全書 提要', '萬民英 전승 / 四庫全書 편찬자', 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)', '자평 명리와 행성 성명술의 구별 및 문헌 전승', '제요 본문 확인', 'Public domain 원전');
add('ziwei', '紫微斗數基本結構', '紫微麥', 'https://www.ziwei.my/zi-wei-dou-shu-portfolio/zwds-guide-zi-wei-dou-shu-basics-2/', '생년·월·일·시에 따른 명반 배치 설명');
add('hko-calendar', 'Chinese calendar', 'Hong Kong Observatory', 'https://www.hko.gov.hk/en/gts/time/Calendar.htm', '태음태양력과 역일 변환 안내');
add('sukuyo-text', '文殊師利菩薩及諸仙所說吉凶時日善惡宿曜經 (T1299)', '不空 번역 전승 / 大正新脩大藏經', 'https://buddhism.lib.ntu.edu.tw/FULLTEXT/sutra/T/T21n1299.pdf', '권21, 1299. 숙·칠요·역일 관련 원문', '서지·원문 발췌 확인', 'Public domain 원전');
add('kotyk-sukuyo', 'Japanese Buddhist Astrology and Astral Magic: Mikkyō and Sukuyōdō', 'Jeffrey Kotyk', 'https://www.jstor.org/stable/26854471', 'Japanese Journal of Religious Studies 45/1 (2018), 37–86', '논문 발췌 확인');
add('korean-calendar', '칠정산내편과 칠정산외편', '국사편찬위원회', 'https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_r300840', '한국 역산의 중국계·이슬람계 요소');
add('korean-astral', '천문대', '한국학중앙연구원', 'https://encykorea.aks.ac.kr/Article/E0055869', '한국 천문 관측과 역사적 성점의 관계');
add('tibetan-elements', 'Tibetan Astrology', 'Philippe Cornu', 'https://www.shambhala.com/tibetan-astrology-1537.html', '원소·메와·파르카 등 티베트 점성술 용어', '출판사 소개 확인');
add('tibetan-calendar', 'Tibetan Calendar Mathematics', 'Svante Janson', 'https://arxiv.org/abs/1401.6285', '티베트 역법의 수학적 구현과 변종', '논문 초록·서지 확인');
add('bon', 'The Causal Vehicles of Bön', 'Ligmincha', 'https://ligmincha.org/events/retreat-the-causal-vehicles-of-bon/', '뵌교 전승의 점성·점복에 관한 자기 설명');
add('thai-manuscript', 'Thai astrological manuscript, EAP691/3/5/47', 'British Library Endangered Archives Programme', 'https://searcharchives.bl.uk/catalog/040-003371343', '점성·시기 선택 도해가 있는 필사본', '필사본 목록 확인');
add('sri-lanka', 'Sinhalese Manuscript Digitisation', 'University of Manchester', 'https://research.manchester.ac.uk/en/projects/sinhalese-manuscript-digitisation/', '싱할라 필사본의 점성술 자료', '자료 목록 확인');
add('mahabote', 'MaHaBote, the Little Key', 'Barbara Cameron', 'https://search.worldcat.org/title/MaHaBote-the-little-key-%3A-a-manual-for-Burmese-astrology/oclc/8800540', 'AFA, 1981, 109쪽. 미얀마 점성술 안내서', '서지 확인; 전문 미확인');
add('myanmar-calendar', 'Myanmar Calendar', 'Yan Naing Aye', 'https://yan9a.github.io/mmcal/', '미얀마 역일 및 관련 전통 배정의 소프트웨어 구현', '프로젝트·문서 확인');
add('bali-calendar', 'Balinese calendar manuscript, Or 16911', 'British Library', 'https://searcharchives.bl.uk/catalog/032-004397024', '발리의 역일 도표 자료', '필사본 목록 확인');
add('maya-calendar', 'The Maya Calendar System', 'Smithsonian National Museum of the American Indian', 'https://maya.nmai.si.edu/calendar/calendar-system', '260일 의례 주기와 다른 역법의 구별');
add('oracc', 'Enūma Anu Enlil commentary, P348755', 'ORACC / CAMS', 'https://oracc.museum.upenn.edu/cams/gkab/P348755', '천문 징조 문헌의 원자료·전사', '원자료 목록·발췌 확인');
add('mul-apin', 'MUL.APIN tablet, 1899,0610.108', 'British Museum', 'https://www.britishmuseum.org/collection/object/W_1899-0610-108', '천문 목록·출몰·역일을 담은 점토판', '소장품 설명 확인');
add('egypt-decans', 'Astrolabe Glossary: Decans', 'History of Science Museum, Oxford', 'https://www.mhs.ox.ac.uk/astrolabe/catalogue/Glossary/mainGlossary/Glossary_ID%3D25.html', '항성 집단에서 황도의 구획으로 이어진 데칸 개념');
add('pal', 'Ptolemaeus Arabus et Latinus — Project', 'Bayerische Akademie der Wissenschaften', 'https://ptolemaeus.badw.de/project', '진작·가탁·번역·필사본·주석의 구별', '프로젝트 설명 확인');
add('ibn-ezra', 'Abraham Ibn Ezra as the Translator of Astrological and Astronomical Texts', 'Shlomo Sela', 'https://brill.com/abstract/journals/me/25/4/article-p345_2.xml', 'Medieval Encounters 25 (2019), 345–380', '논문 초록 확인');
add('yavanajataka', 'The Date and Nature of Sphujidhvaja’s Yavanajātaka Reconsidered', 'Bill M. Mak', 'https://journals.library.ualberta.ca/hssa/index.php/hssa/article/view/7', 'History of Science in South Asia 1 (2013), 1–20', '논문 초록 확인', 'CC BY-SA 4.0');
add('osf', 'Preregistration', 'Center for Open Science', 'https://www.cos.io/initiatives/prereg', '확증·탐색의 구별, 공개자료의 사전 지식 명시');
add('nist-statistics', 'NIST/SEMATECH e-Handbook of Statistical Methods', 'NIST', 'https://www.itl.nist.gov/div898/handbook/prc/section4/prc47.htm', '다중 비교 관련 설명. 다른 연구 용어의 정의·주의점은 이 프로젝트의 편집 기준이다.');
add('carlson', 'A double-blind test of astrology', 'Shawn Carlson', 'https://doi.org/10.1038/318419a0', 'Nature 318 (1985), 419–425. 연구 설계의 사례로 인용한다.', '논문 초록·서지 확인');

add('nakshatra-names', '27 Nakshatra Names', 'Drik Panchang', 'https://www.drikpanchang.com/tutorials/nakshatra/nakshatra.html', '27낙샤트라의 순서와 원어 명칭', '명칭 표 확인');
add('chinese-lodge-names', '中國星區、星官及星名英譯表', 'Hong Kong Space Museum', 'https://hk.space.museum/en/web/spm/resources/teachers-corner/constellations-and-myths/glossary-of-chinese-star-regions-asterisms-and-star-names.html', '四象·二十八宿 표', '명칭 표 확인');

add('korean-lodge-names', '동양의 별자리', '한국천문연구원', 'https://astro.kasi.re.kr/kor/post/easternConstellation', '동·북·서·남방 7수의 한국어 명칭과 기준 항성', '명칭 표 확인');

export const canonicalReference = id => aliases.get(id);
export const terminologySources = records;
export const terminologySourceById = id => records.find(s => s.id === (aliases.get(id) || id));
