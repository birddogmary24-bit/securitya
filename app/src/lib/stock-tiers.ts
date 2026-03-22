// stock-tiers.ts
// 한국 개인투자자 인기 미국 주식 티어 분류
// Tier 1: 최다 거래 인기 종목 50개 (6종 API 전체 수집)
// Tier 2: 한국 투자자 거래량 상위 개별주 100개 (6종 API 전체 수집)
// Tier 3: 나머지 개별주 + ETF (quote/news만 기본 수집)

export interface TieredStock {
  ticker: string;
  name: string;
  nameKr: string;
  tier: 1 | 2 | 3;
  isEtf?: boolean;  // ETF 여부 (true면 financials/recommendations 수집 제외)
}

// ─────────────────────────────────────────────
// Tier 1: 한국 투자자 최다 거래 인기 종목 (50개)
// ─────────────────────────────────────────────
export const TIER1_STOCKS: TieredStock[] = [
  // Big Tech (9)
  { ticker: 'AAPL', name: 'Apple Inc.', nameKr: '애플', tier: 1 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', nameKr: '마이크로소프트', tier: 1 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', nameKr: '엔비디아', tier: 1 },
  { ticker: 'TSLA', name: 'Tesla Inc.', nameKr: '테슬라', tier: 1 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', nameKr: '아마존', tier: 1 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', nameKr: '알파벳(구글)', tier: 1 },
  { ticker: 'META', name: 'Meta Platforms Inc.', nameKr: '메타(페이스북)', tier: 1 },
  { ticker: 'AMD', name: 'Advanced Micro Devices Inc.', nameKr: 'AMD', tier: 1 },
  { ticker: 'NFLX', name: 'Netflix Inc.', nameKr: '넷플릭스', tier: 1 },

  // Fintech / Crypto (6)
  { ticker: 'COIN', name: 'Coinbase Global Inc.', nameKr: '코인베이스', tier: 1 },
  { ticker: 'SOFI', name: 'SoFi Technologies Inc.', nameKr: '소파이', tier: 1 },
  { ticker: 'SQ', name: 'Block Inc.', nameKr: '블록(스퀘어)', tier: 1 },
  { ticker: 'MARA', name: 'Marathon Digital Holdings', nameKr: '마라톤디지털', tier: 1 },
  { ticker: 'RIOT', name: 'Riot Platforms Inc.', nameKr: '라이엇플랫폼스', tier: 1 },
  { ticker: 'MSTR', name: 'MicroStrategy Inc.', nameKr: '마이크로스트래티지', tier: 1 },

  // China / EV (2)
  { ticker: 'BABA', name: 'Alibaba Group Holding', nameKr: '알리바바', tier: 1 },
  { ticker: 'NIO', name: 'NIO Inc.', nameKr: '니오', tier: 1 },

  // Semiconductors (7)
  { ticker: 'AVGO', name: 'Broadcom Inc.', nameKr: '브로드컴', tier: 1 },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', nameKr: '퀄컴', tier: 1 },
  { ticker: 'MU', name: 'Micron Technology Inc.', nameKr: '마이크론', tier: 1 },
  { ticker: 'INTC', name: 'Intel Corporation', nameKr: '인텔', tier: 1 },
  { ticker: 'ARM', name: 'Arm Holdings plc', nameKr: 'ARM홀딩스', tier: 1 },
  { ticker: 'SMCI', name: 'Super Micro Computer Inc.', nameKr: '슈퍼마이크로컴퓨터', tier: 1 },
  { ticker: 'IONQ', name: 'IonQ Inc.', nameKr: '아이온큐', tier: 1 },

  // Finance (4)
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', nameKr: 'JP모건', tier: 1 },
  { ticker: 'V', name: 'Visa Inc.', nameKr: '비자', tier: 1 },
  { ticker: 'MA', name: 'Mastercard Inc.', nameKr: '마스터카드', tier: 1 },
  { ticker: 'BAC', name: 'Bank of America Corp.', nameKr: '뱅크오브아메리카', tier: 1 },

  // Consumer (7)
  { ticker: 'COST', name: 'Costco Wholesale Corp.', nameKr: '코스트코', tier: 1 },
  { ticker: 'WMT', name: 'Walmart Inc.', nameKr: '월마트', tier: 1 },
  { ticker: 'KO', name: 'The Coca-Cola Company', nameKr: '코카콜라', tier: 1 },
  { ticker: 'PEP', name: 'PepsiCo Inc.', nameKr: '펩시코', tier: 1 },
  { ticker: 'DIS', name: 'The Walt Disney Company', nameKr: '디즈니', tier: 1 },
  { ticker: 'NKE', name: 'NIKE Inc.', nameKr: '나이키', tier: 1 },
  { ticker: 'ABNB', name: 'Airbnb Inc.', nameKr: '에어비앤비', tier: 1 },

  // Healthcare (5)
  { ticker: 'JNJ', name: 'Johnson & Johnson', nameKr: '존슨앤존슨', tier: 1 },
  { ticker: 'PFE', name: 'Pfizer Inc.', nameKr: '화이자', tier: 1 },
  { ticker: 'MRNA', name: 'Moderna Inc.', nameKr: '모더나', tier: 1 },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', nameKr: '유나이티드헬스', tier: 1 },
  { ticker: 'LLY', name: 'Eli Lilly and Company', nameKr: '일라이릴리', tier: 1 },

  // Energy (2)
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', nameKr: '엑슨모빌', tier: 1 },
  { ticker: 'CVX', name: 'Chevron Corporation', nameKr: '셰브론', tier: 1 },

  // Cloud / SaaS (5)
  { ticker: 'CRM', name: 'Salesforce Inc.', nameKr: '세일즈포스', tier: 1 },
  { ticker: 'PYPL', name: 'PayPal Holdings Inc.', nameKr: '페이팔', tier: 1 },
  { ticker: 'SHOP', name: 'Shopify Inc.', nameKr: '쇼피파이', tier: 1 },
  { ticker: 'UBER', name: 'Uber Technologies Inc.', nameKr: '우버', tier: 1 },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc.', nameKr: '팔란티어', tier: 1 },

  // Other (3) — BA, HD, BRK.B는 한투 거래량 최상위
  { ticker: 'BA', name: 'The Boeing Company', nameKr: '보잉', tier: 1 },
  { ticker: 'HD', name: 'The Home Depot Inc.', nameKr: '홈디포', tier: 1 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', nameKr: '버크셔해서웨이', tier: 1 },
];

// ─────────────────────────────────────────────
// Tier 2: 한국 투자자 거래량 상위 개별주 (100개, ETF 제외)
// ─────────────────────────────────────────────
export const TIER2_STOCKS: TieredStock[] = [
  // High-cap tech (8)
  { ticker: 'ASML', name: 'ASML Holding N.V.', nameKr: 'ASML', tier: 2 },
  { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing', nameKr: 'TSMC', tier: 2 },
  { ticker: 'ORCL', name: 'Oracle Corporation', nameKr: '오라클', tier: 2 },
  { ticker: 'IBM', name: 'International Business Machines', nameKr: 'IBM', tier: 2 },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', nameKr: '시스코', tier: 2 },
  { ticker: 'DELL', name: 'Dell Technologies Inc.', nameKr: '델', tier: 2 },
  { ticker: 'ADBE', name: 'Adobe Inc.', nameKr: '어도비', tier: 2 },
  { ticker: 'NOW', name: 'ServiceNow Inc.', nameKr: '서비스나우', tier: 2 },

  // Popular semis (9)
  { ticker: 'LRCX', name: 'Lam Research Corporation', nameKr: '램리서치', tier: 2 },
  { ticker: 'AMAT', name: 'Applied Materials Inc.', nameKr: '어플라이드머티리얼즈', tier: 2 },
  { ticker: 'MRVL', name: 'Marvell Technology Inc.', nameKr: '마벨테크놀로지', tier: 2 },
  { ticker: 'ON', name: 'ON Semiconductor Corp.', nameKr: 'ON세미컨덕터', tier: 2 },
  { ticker: 'ADI', name: 'Analog Devices Inc.', nameKr: '아날로그디바이시스', tier: 2 },
  { ticker: 'NXPI', name: 'NXP Semiconductors N.V.', nameKr: 'NXP세미컨덕터스', tier: 2 },
  { ticker: 'ANET', name: 'Arista Networks Inc.', nameKr: '아리스타네트웍스', tier: 2 },
  { ticker: 'APP', name: 'AppLovin Corporation', nameKr: '앱러빈', tier: 2 },
  { ticker: 'VRT', name: 'Vertiv Holdings Co.', nameKr: '버티브', tier: 2 },

  // Social / Internet (7)
  { ticker: 'RBLX', name: 'Roblox Corporation', nameKr: '로블록스', tier: 2 },
  { ticker: 'SNAP', name: 'Snap Inc.', nameKr: '스냅', tier: 2 },
  { ticker: 'ROKU', name: 'Roku Inc.', nameKr: '로쿠', tier: 2 },
  { ticker: 'SPOT', name: 'Spotify Technology S.A.', nameKr: '스포티파이', tier: 2 },
  { ticker: 'TTD', name: 'The Trade Desk Inc.', nameKr: '트레이드데스크', tier: 2 },
  { ticker: 'DASH', name: 'DoorDash Inc.', nameKr: '도어대시', tier: 2 },
  { ticker: 'DKNG', name: 'DraftKings Inc.', nameKr: '드래프트킹스', tier: 2 },

  // Security / Cloud (8)
  { ticker: 'CRWD', name: 'CrowdStrike Holdings Inc.', nameKr: '크라우드스트라이크', tier: 2 },
  { ticker: 'PANW', name: 'Palo Alto Networks Inc.', nameKr: '팔로알토네트웍스', tier: 2 },
  { ticker: 'SNOW', name: 'Snowflake Inc.', nameKr: '스노우플레이크', tier: 2 },
  { ticker: 'NET', name: 'Cloudflare Inc.', nameKr: '클라우드플레어', tier: 2 },
  { ticker: 'DDOG', name: 'Datadog Inc.', nameKr: '데이터독', tier: 2 },
  { ticker: 'ZS', name: 'Zscaler Inc.', nameKr: '지스케일러', tier: 2 },
  { ticker: 'OKTA', name: 'Okta Inc.', nameKr: '옥타', tier: 2 },
  { ticker: 'MDB', name: 'MongoDB Inc.', nameKr: '몽고DB', tier: 2 },

  // EV / Auto (6)
  { ticker: 'RIVN', name: 'Rivian Automotive Inc.', nameKr: '리비안', tier: 2 },
  { ticker: 'LCID', name: 'Lucid Group Inc.', nameKr: '루시드', tier: 2 },
  { ticker: 'F', name: 'Ford Motor Company', nameKr: '포드', tier: 2 },
  { ticker: 'GM', name: 'General Motors Company', nameKr: 'GM(제너럴모터스)', tier: 2 },
  { ticker: 'LI', name: 'Li Auto Inc.', nameKr: '리오토', tier: 2 },
  { ticker: 'XPEV', name: 'XPeng Inc.', nameKr: '샤오펑', tier: 2 },

  // China (5)
  { ticker: 'PDD', name: 'PDD Holdings Inc.', nameKr: 'PDD(핀둬둬)', tier: 2 },
  { ticker: 'JD', name: 'JD.com Inc.', nameKr: '징둥', tier: 2 },
  { ticker: 'BIDU', name: 'Baidu Inc.', nameKr: '바이두', tier: 2 },
  { ticker: 'CPNG', name: 'Coupang Inc.', nameKr: '쿠팡', tier: 2 },
  { ticker: 'FUTU', name: 'Futu Holdings Limited', nameKr: '푸투홀딩스', tier: 2 },

  // Finance (6)
  { ticker: 'GS', name: 'The Goldman Sachs Group', nameKr: '골드만삭스', tier: 2 },
  { ticker: 'MS', name: 'Morgan Stanley', nameKr: '모건스탠리', tier: 2 },
  { ticker: 'WFC', name: 'Wells Fargo & Company', nameKr: '웰스파고', tier: 2 },
  { ticker: 'C', name: 'Citigroup Inc.', nameKr: '시티그룹', tier: 2 },
  { ticker: 'HOOD', name: 'Robinhood Markets Inc.', nameKr: '로빈후드', tier: 2 },
  { ticker: 'BLK', name: 'BlackRock Inc.', nameKr: '블랙록', tier: 2 },

  // Healthcare (5)
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc.', nameKr: '인튜이티브서지컬', tier: 2 },
  { ticker: 'REGN', name: 'Regeneron Pharmaceuticals', nameKr: '리제네론', tier: 2 },
  { ticker: 'GILD', name: 'Gilead Sciences Inc.', nameKr: '길리어드사이언스', tier: 2 },
  { ticker: 'ABBV', name: 'AbbVie Inc.', nameKr: '애브비', tier: 2 },
  { ticker: 'AMGN', name: 'Amgen Inc.', nameKr: '암젠', tier: 2 },

  // Consumer (6)
  { ticker: 'PG', name: 'Procter & Gamble Co.', nameKr: 'P&G', tier: 2 },
  { ticker: 'MCD', name: "McDonald's Corporation", nameKr: '맥도날드', tier: 2 },
  { ticker: 'SBUX', name: 'Starbucks Corporation', nameKr: '스타벅스', tier: 2 },
  { ticker: 'BKNG', name: 'Booking Holdings Inc.', nameKr: '부킹홀딩스', tier: 2 },
  { ticker: 'CMG', name: 'Chipotle Mexican Grill', nameKr: '치폴레', tier: 2 },
  { ticker: 'LULU', name: 'Lululemon Athletica Inc.', nameKr: '룰루레몬', tier: 2 },

  // Energy / Industrial (8)
  { ticker: 'ENPH', name: 'Enphase Energy Inc.', nameKr: '엔페이즈에너지', tier: 2 },
  { ticker: 'FSLR', name: 'First Solar Inc.', nameKr: '퍼스트솔라', tier: 2 },
  { ticker: 'PLUG', name: 'Plug Power Inc.', nameKr: '플러그파워', tier: 2 },
  { ticker: 'CAT', name: 'Caterpillar Inc.', nameKr: '캐터필러', tier: 2 },
  { ticker: 'GE', name: 'GE Aerospace', nameKr: 'GE에어로스페이스', tier: 2 },
  { ticker: 'RTX', name: 'RTX Corporation', nameKr: 'RTX(레이시온)', tier: 2 },
  { ticker: 'LMT', name: 'Lockheed Martin Corporation', nameKr: '록히드마틴', tier: 2 },
  { ticker: 'HON', name: 'Honeywell International Inc.', nameKr: '허니웰', tier: 2 },

  // Fintech (2)
  { ticker: 'AFRM', name: 'Affirm Holdings Inc.', nameKr: '어펌', tier: 2 },
  { ticker: 'NU', name: 'Nu Holdings Ltd.', nameKr: '누홀딩스', tier: 2 },

  // Gaming (4)
  { ticker: 'EA', name: 'Electronic Arts Inc.', nameKr: 'EA(일렉트로닉아츠)', tier: 2 },
  { ticker: 'TTWO', name: 'Take-Two Interactive Software', nameKr: '테이크투', tier: 2 },
  { ticker: 'U', name: 'Unity Software Inc.', nameKr: '유니티', tier: 2 },
  { ticker: 'SE', name: 'Sea Limited', nameKr: '씨리미티드', tier: 2 },

  // Trending / Meme / Growth (22)
  { ticker: 'GME', name: 'GameStop Corp.', nameKr: '게임스탑', tier: 2 },
  { ticker: 'AMC', name: 'AMC Entertainment Holdings', nameKr: 'AMC엔터테인먼트', tier: 2 },
  { ticker: 'UPST', name: 'Upstart Holdings Inc.', nameKr: '업스타트', tier: 2 },
  { ticker: 'AI', name: 'C3.ai Inc.', nameKr: 'C3.ai', tier: 2 },
  { ticker: 'BBAI', name: 'BigBear.ai Holdings', nameKr: '빅베어AI', tier: 2 },
  { ticker: 'RGTI', name: 'Rigetti Computing Inc.', nameKr: '리게티컴퓨팅', tier: 2 },
  { ticker: 'QUBT', name: 'Quantum Computing Inc.', nameKr: '퀀텀컴퓨팅', tier: 2 },
  { ticker: 'VST', name: 'Vistra Corp.', nameKr: '비스트라', tier: 2 },
  { ticker: 'CEG', name: 'Constellation Energy Corporation', nameKr: '컨스텔레이션에너지', tier: 2 },
  { ticker: 'OKLO', name: 'Oklo Inc.', nameKr: '오클로', tier: 2 },
  { ticker: 'RKLB', name: 'Rocket Lab USA Inc.', nameKr: '로켓랩', tier: 2 },
  { ticker: 'SOUN', name: 'SoundHound AI Inc.', nameKr: '사운드하운드AI', tier: 2 },
  { ticker: 'HIMS', name: 'Hims & Hers Health Inc.', nameKr: '힘스앤허스', tier: 2 },
  { ticker: 'CAVA', name: 'CAVA Group Inc.', nameKr: '카바그룹', tier: 2 },
  { ticker: 'DUOL', name: 'Duolingo Inc.', nameKr: '듀오링고', tier: 2 },
  { ticker: 'JOBY', name: 'Joby Aviation Inc.', nameKr: '조비에비에이션', tier: 2 },
  { ticker: 'ONON', name: 'On Holding AG', nameKr: '온홀딩', tier: 2 },
  { ticker: 'ASTS', name: 'AST SpaceMobile Inc.', nameKr: 'AST스페이스모바일', tier: 2 },
  { ticker: 'CLSK', name: 'CleanSpark Inc.', nameKr: '클린스파크', tier: 2 },
  { ticker: 'IREN', name: 'Iris Energy Limited', nameKr: '아이리스에너지', tier: 2 },
  { ticker: 'CORZ', name: 'Core Scientific Inc.', nameKr: '코어사이언티픽', tier: 2 },
  { ticker: 'CELH', name: 'Celsius Holdings Inc.', nameKr: '셀시우스', tier: 2 },

  // Other popular (4)
  { ticker: 'TWLO', name: 'Twilio Inc.', nameKr: '트윌리오', tier: 2 },
  { ticker: 'ETSY', name: 'Etsy Inc.', nameKr: '엣시', tier: 2 },
  { ticker: 'PINS', name: 'Pinterest Inc.', nameKr: '핀터레스트', tier: 2 },
  { ticker: 'LYFT', name: 'Lyft Inc.', nameKr: '리프트', tier: 2 },
];

// ─────────────────────────────────────────────
// Tier 3: 나머지 개별주 + ETF (quote/news 기본 수집)
// ─────────────────────────────────────────────
export const TIER3_STOCKS: TieredStock[] = [
  // ─── 나머지 개별주 (Tier 2에서 제외된 종목) ───

  // Semiconductors
  { ticker: 'KLAC', name: 'KLA Corporation', nameKr: 'KLA', tier: 3 },
  { ticker: 'TXN', name: 'Texas Instruments Inc.', nameKr: '텍사스인스트루먼트', tier: 3 },
  { ticker: 'GFS', name: 'GlobalFoundries Inc.', nameKr: '글로벌파운드리스', tier: 3 },
  { ticker: 'WOLF', name: 'Wolfspeed Inc.', nameKr: '울프스피드', tier: 3 },
  { ticker: 'MCHP', name: 'Microchip Technology Inc.', nameKr: '마이크로칩테크놀로지', tier: 3 },
  { ticker: 'STM', name: 'STMicroelectronics N.V.', nameKr: 'ST마이크로', tier: 3 },
  { ticker: 'ONTO', name: 'Onto Innovation Inc.', nameKr: '온투이노베이션', tier: 3 },
  { ticker: 'CRDO', name: 'Credo Technology Group Holding', nameKr: '크레도테크놀로지', tier: 3 },
  { ticker: 'SMTC', name: 'Semtech Corporation', nameKr: '셈텍', tier: 3 },
  { ticker: 'SWKS', name: 'Skyworks Solutions Inc.', nameKr: '스카이웍스', tier: 3 },
  { ticker: 'QRVO', name: 'Qorvo Inc.', nameKr: '코르보', tier: 3 },
  { ticker: 'MPWR', name: 'Monolithic Power Systems Inc.', nameKr: '모놀리식파워', tier: 3 },

  // Software / Cloud
  { ticker: 'INTU', name: 'Intuit Inc.', nameKr: '인튜이트', tier: 3 },
  { ticker: 'SPLK', name: 'Splunk Inc.', nameKr: '스플렁크', tier: 3 },
  { ticker: 'TEAM', name: 'Atlassian Corporation', nameKr: '아틀라시안', tier: 3 },
  { ticker: 'WDAY', name: 'Workday Inc.', nameKr: '워크데이', tier: 3 },
  { ticker: 'HUBS', name: 'HubSpot Inc.', nameKr: '허브스팟', tier: 3 },
  { ticker: 'VEEV', name: 'Veeva Systems Inc.', nameKr: '비바시스템즈', tier: 3 },
  { ticker: 'BILL', name: 'BILL Holdings Inc.', nameKr: '빌홀딩스', tier: 3 },
  { ticker: 'CFLT', name: 'Confluent Inc.', nameKr: '컨플루언트', tier: 3 },
  { ticker: 'PATH', name: 'UiPath Inc.', nameKr: '유아이패스', tier: 3 },
  { ticker: 'DOCN', name: 'DigitalOcean Holdings Inc.', nameKr: '디지털오션', tier: 3 },
  { ticker: 'ESTC', name: 'Elastic N.V.', nameKr: '엘라스틱', tier: 3 },
  { ticker: 'GTLB', name: 'GitLab Inc.', nameKr: '깃랩', tier: 3 },
  { ticker: 'S', name: 'SentinelOne Inc.', nameKr: '센티넬원', tier: 3 },
  { ticker: 'MNDY', name: 'monday.com Ltd.', nameKr: '먼데이닷컴', tier: 3 },
  { ticker: 'PCOR', name: 'Procore Technologies Inc.', nameKr: '프로코어', tier: 3 },
  { ticker: 'ZI', name: 'ZoomInfo Technologies Inc.', nameKr: '줌인포', tier: 3 },
  { ticker: 'CDNS', name: 'Cadence Design Systems Inc.', nameKr: '케이던스디자인', tier: 3 },
  { ticker: 'SNPS', name: 'Synopsys Inc.', nameKr: '시놉시스', tier: 3 },
  { ticker: 'ANSS', name: 'ANSYS Inc.', nameKr: '앤시스', tier: 3 },
  { ticker: 'FICO', name: 'Fair Isaac Corporation', nameKr: 'FICO', tier: 3 },
  { ticker: 'ACN', name: 'Accenture plc', nameKr: '액센추어', tier: 3 },
  { ticker: 'CTSH', name: 'Cognizant Technology Solutions', nameKr: '코그니전트', tier: 3 },
  { ticker: 'FTNT', name: 'Fortinet Inc.', nameKr: '포티넷', tier: 3 },
  { ticker: 'AKAM', name: 'Akamai Technologies Inc.', nameKr: '아카마이', tier: 3 },
  { ticker: 'EPAM', name: 'EPAM Systems Inc.', nameKr: 'EPAM시스템즈', tier: 3 },
  { ticker: 'PAYC', name: 'Paycom Software Inc.', nameKr: '페이컴', tier: 3 },
  { ticker: 'MANH', name: 'Manhattan Associates Inc.', nameKr: '맨하탄어소시에이츠', tier: 3 },
  { ticker: 'NTNX', name: 'Nutanix Inc.', nameKr: '누타닉스', tier: 3 },
  { ticker: 'VRNS', name: 'Varonis Systems Inc.', nameKr: '바로니스', tier: 3 },
  { ticker: 'RPD', name: 'Rapid7 Inc.', nameKr: '래피드7', tier: 3 },
  { ticker: 'TENB', name: 'Tenable Holdings Inc.', nameKr: '테너블', tier: 3 },
  { ticker: 'CYBR', name: 'CyberArk Software Ltd.', nameKr: '사이버아크', tier: 3 },
  { ticker: 'QLYS', name: 'Qualys Inc.', nameKr: '퀄리스', tier: 3 },
  { ticker: 'GEN', name: 'Gen Digital Inc.', nameKr: '젠디지털', tier: 3 },
  { ticker: 'SMAR', name: 'Smartsheet Inc.', nameKr: '스마트시트', tier: 3 },
  { ticker: 'APPF', name: 'AppFolio Inc.', nameKr: '앱폴리오', tier: 3 },
  { ticker: 'TWKS', name: 'Thoughtworks Holding Inc.', nameKr: '소트웍스', tier: 3 },
  { ticker: 'GLOB', name: 'Globant S.A.', nameKr: '글로벌런트', tier: 3 },
  { ticker: 'GDDY', name: 'GoDaddy Inc.', nameKr: '고대디', tier: 3 },
  { ticker: 'WIX', name: 'Wix.com Ltd.', nameKr: '윅스', tier: 3 },
  { ticker: 'DOCU', name: 'DocuSign Inc.', nameKr: '도큐사인', tier: 3 },
  { ticker: 'ZM', name: 'Zoom Video Communications Inc.', nameKr: '줌비디오', tier: 3 },
  { ticker: 'FIVN', name: 'Five9 Inc.', nameKr: '파이브나인', tier: 3 },

  // Social / Internet
  { ticker: 'MTCH', name: 'Match Group Inc.', nameKr: '매치그룹', tier: 3 },
  { ticker: 'CHWY', name: 'Chewy Inc.', nameKr: '츄이', tier: 3 },
  { ticker: 'W', name: 'Wayfair Inc.', nameKr: '웨이페어', tier: 3 },
  { ticker: 'PENN', name: 'PENN Entertainment Inc.', nameKr: 'PENN엔터테인먼트', tier: 3 },

  // Enterprise IT
  { ticker: 'HPQ', name: 'HP Inc.', nameKr: 'HP', tier: 3 },
  { ticker: 'HPE', name: 'Hewlett Packard Enterprise', nameKr: 'HPE', tier: 3 },

  // Consumer
  { ticker: 'TGT', name: 'Target Corporation', nameKr: '타겟', tier: 3 },
  { ticker: 'LOW', name: "Lowe's Companies Inc.", nameKr: '로우스', tier: 3 },
  { ticker: 'TJX', name: 'The TJX Companies Inc.', nameKr: 'TJX', tier: 3 },
  { ticker: 'ROST', name: 'Ross Stores Inc.', nameKr: '로스스토어스', tier: 3 },
  { ticker: 'GPS', name: 'Gap Inc.', nameKr: '갭', tier: 3 },
  { ticker: 'EL', name: 'The Estee Lauder Companies', nameKr: '에스티로더', tier: 3 },
  { ticker: 'YUM', name: 'Yum! Brands Inc.', nameKr: '얌브랜즈', tier: 3 },
  { ticker: 'MNST', name: 'Monster Beverage Corporation', nameKr: '몬스터비버리지', tier: 3 },
  { ticker: 'EXPE', name: 'Expedia Group Inc.', nameKr: '익스피디아', tier: 3 },
  { ticker: 'MAR', name: 'Marriott International Inc.', nameKr: '메리어트', tier: 3 },
  { ticker: 'HLT', name: 'Hilton Worldwide Holdings Inc.', nameKr: '힐튼', tier: 3 },
  { ticker: 'ORLY', name: "O'Reilly Automotive Inc.", nameKr: '오라일리오토', tier: 3 },
  { ticker: 'AZO', name: 'AutoZone Inc.', nameKr: '오토존', tier: 3 },
  { ticker: 'ULTA', name: 'Ulta Beauty Inc.', nameKr: '울타뷰티', tier: 3 },
  { ticker: 'DG', name: 'Dollar General Corporation', nameKr: '달러제너럴', tier: 3 },
  { ticker: 'DLTR', name: 'Dollar Tree Inc.', nameKr: '달러트리', tier: 3 },
  { ticker: 'KHC', name: 'The Kraft Heinz Company', nameKr: '크래프트하인즈', tier: 3 },
  { ticker: 'MDLZ', name: 'Mondelez International Inc.', nameKr: '몬델리즈', tier: 3 },
  { ticker: 'DECK', name: 'Deckers Outdoor Corporation', nameKr: '데커스아웃도어', tier: 3 },
  { ticker: 'CL', name: 'Colgate-Palmolive Company', nameKr: '콜게이트팜올리브', tier: 3 },
  { ticker: 'KMB', name: 'Kimberly-Clark Corporation', nameKr: '킴벌리클라크', tier: 3 },
  { ticker: 'GIS', name: 'General Mills Inc.', nameKr: '제너럴밀스', tier: 3 },
  { ticker: 'K', name: 'Kellanova', nameKr: '켈라노바', tier: 3 },
  { ticker: 'HSY', name: 'The Hershey Company', nameKr: '허쉬', tier: 3 },
  { ticker: 'SJM', name: 'The J.M. Smucker Company', nameKr: '스머커', tier: 3 },
  { ticker: 'TPR', name: 'Tapestry Inc.', nameKr: '태피스트리(코치)', tier: 3 },
  { ticker: 'RL', name: 'Ralph Lauren Corporation', nameKr: '랄프로렌', tier: 3 },
  { ticker: 'WYNN', name: 'Wynn Resorts Limited', nameKr: '윈리조트', tier: 3 },
  { ticker: 'LVS', name: 'Las Vegas Sands Corp.', nameKr: '라스베이거스샌즈', tier: 3 },
  { ticker: 'MGM', name: 'MGM Resorts International', nameKr: 'MGM리조트', tier: 3 },
  { ticker: 'NCLH', name: 'Norwegian Cruise Line Holdings', nameKr: '노르웨이지안크루즈', tier: 3 },
  { ticker: 'RCL', name: 'Royal Caribbean Cruises Ltd.', nameKr: '로열캐리비안', tier: 3 },
  { ticker: 'PLNT', name: 'Planet Fitness Inc.', nameKr: '플래닛피트니스', tier: 3 },
  { ticker: 'CCL', name: 'Carnival Corporation', nameKr: '카니발크루즈', tier: 3 },
  { ticker: 'H', name: 'Hyatt Hotels Corporation', nameKr: '하얏트', tier: 3 },
  { ticker: 'IHG', name: 'InterContinental Hotels Group', nameKr: 'IHG호텔', tier: 3 },
  { ticker: 'ARMK', name: 'Aramark', nameKr: '아라마크', tier: 3 },
  { ticker: 'DNUT', name: 'Krispy Kreme Inc.', nameKr: '크리스피크림', tier: 3 },

  // Energy
  { ticker: 'OXY', name: 'Occidental Petroleum Corp.', nameKr: '옥시덴탈페트롤리엄', tier: 3 },
  { ticker: 'SLB', name: 'Schlumberger Limited', nameKr: '슐룸버거', tier: 3 },
  { ticker: 'EOG', name: 'EOG Resources Inc.', nameKr: 'EOG리소시스', tier: 3 },
  { ticker: 'DVN', name: 'Devon Energy Corporation', nameKr: '데본에너지', tier: 3 },
  { ticker: 'FANG', name: 'Diamondback Energy Inc.', nameKr: '다이아몬드백에너지', tier: 3 },
  { ticker: 'MPC', name: 'Marathon Petroleum Corp.', nameKr: '마라톤페트롤리엄', tier: 3 },
  { ticker: 'VLO', name: 'Valero Energy Corporation', nameKr: '발레로에너지', tier: 3 },
  { ticker: 'PSX', name: 'Phillips 66', nameKr: '필립스66', tier: 3 },
  { ticker: 'SEDG', name: 'SolarEdge Technologies', nameKr: '솔라엣지', tier: 3 },
  { ticker: 'RUN', name: 'Sunrun Inc.', nameKr: '선런', tier: 3 },
  { ticker: 'BE', name: 'Bloom Energy Corporation', nameKr: '블룸에너지', tier: 3 },
  { ticker: 'NEE', name: 'NextEra Energy Inc.', nameKr: '넥스트에라에너지', tier: 3 },
  { ticker: 'AES', name: 'The AES Corporation', nameKr: 'AES', tier: 3 },
  { ticker: 'COP', name: 'ConocoPhillips', nameKr: '코노코필립스', tier: 3 },
  { ticker: 'HES', name: 'Hess Corporation', nameKr: '헤스', tier: 3 },
  { ticker: 'CTRA', name: 'Coterra Energy Inc.', nameKr: '코테라에너지', tier: 3 },
  { ticker: 'EQT', name: 'EQT Corporation', nameKr: 'EQT', tier: 3 },
  { ticker: 'OKE', name: 'ONEOK Inc.', nameKr: '원옥', tier: 3 },
  { ticker: 'WMB', name: 'The Williams Companies Inc.', nameKr: '윌리엄스', tier: 3 },
  { ticker: 'KMI', name: 'Kinder Morgan Inc.', nameKr: '킨더모건', tier: 3 },
  { ticker: 'ET', name: 'Energy Transfer LP', nameKr: '에너지트랜스퍼', tier: 3 },
  { ticker: 'HAL', name: 'Halliburton Company', nameKr: '할리버튼', tier: 3 },
  { ticker: 'BKR', name: 'Baker Hughes Company', nameKr: '베이커휴즈', tier: 3 },
  { ticker: 'TRGP', name: 'Targa Resources Corp.', nameKr: '타르가리소시스', tier: 3 },
  { ticker: 'EPD', name: 'Enterprise Products Partners LP', nameKr: '엔터프라이즈프로덕츠', tier: 3 },

  // Finance
  { ticker: 'AXP', name: 'American Express Company', nameKr: '아메리칸익스프레스', tier: 3 },
  { ticker: 'SCHW', name: 'Charles Schwab Corporation', nameKr: '찰스슈왑', tier: 3 },
  { ticker: 'SPGI', name: 'S&P Global Inc.', nameKr: 'S&P글로벌', tier: 3 },
  { ticker: 'CME', name: 'CME Group Inc.', nameKr: 'CME그룹', tier: 3 },
  { ticker: 'ICE', name: 'Intercontinental Exchange', nameKr: 'ICE', tier: 3 },
  { ticker: 'FIS', name: 'Fidelity National Information', nameKr: 'FIS', tier: 3 },
  { ticker: 'FISV', name: 'Fiserv Inc.', nameKr: '파이서브', tier: 3 },
  { ticker: 'GPN', name: 'Global Payments Inc.', nameKr: '글로벌페이먼츠', tier: 3 },
  { ticker: 'PGR', name: 'The Progressive Corporation', nameKr: '프로그레시브', tier: 3 },
  { ticker: 'ALL', name: 'The Allstate Corporation', nameKr: '올스테이트', tier: 3 },
  { ticker: 'TRV', name: 'The Travelers Companies Inc.', nameKr: '트래블러스', tier: 3 },
  { ticker: 'USB', name: 'U.S. Bancorp', nameKr: 'US뱅코프', tier: 3 },
  { ticker: 'PNC', name: 'The PNC Financial Services Group', nameKr: 'PNC파이낸셜', tier: 3 },
  { ticker: 'TFC', name: 'Truist Financial Corporation', nameKr: '트루이스트', tier: 3 },
  { ticker: 'TROW', name: 'T. Rowe Price Group Inc.', nameKr: 'T로우프라이스', tier: 3 },
  { ticker: 'MET', name: 'MetLife Inc.', nameKr: '메트라이프', tier: 3 },
  { ticker: 'PRU', name: 'Prudential Financial Inc.', nameKr: '프루덴셜', tier: 3 },
  { ticker: 'AFL', name: 'Aflac Incorporated', nameKr: '애플락', tier: 3 },
  { ticker: 'AIG', name: 'American International Group', nameKr: 'AIG', tier: 3 },
  { ticker: 'FITB', name: 'Fifth Third Bancorp', nameKr: '피프스서드', tier: 3 },
  { ticker: 'MTB', name: 'M&T Bank Corporation', nameKr: 'M&T뱅크', tier: 3 },
  { ticker: 'RF', name: 'Regions Financial Corporation', nameKr: '리전스파이낸셜', tier: 3 },
  { ticker: 'CFG', name: 'Citizens Financial Group Inc.', nameKr: '시티즌스파이낸셜', tier: 3 },
  { ticker: 'HBAN', name: 'Huntington Bancshares Inc.', nameKr: '헌팅턴뱅크', tier: 3 },
  { ticker: 'KEY', name: 'KeyCorp', nameKr: '키코프', tier: 3 },
  { ticker: 'MSCI', name: 'MSCI Inc.', nameKr: 'MSCI', tier: 3 },
  { ticker: 'MKTX', name: 'MarketAxess Holdings Inc.', nameKr: '마켓액세스', tier: 3 },
  { ticker: 'NDAQ', name: 'Nasdaq Inc.', nameKr: '나스닥', tier: 3 },
  { ticker: 'BK', name: 'The Bank of New York Mellon Corp.', nameKr: 'BNY멜론', tier: 3 },
  { ticker: 'STT', name: 'State Street Corporation', nameKr: '스테이트스트리트', tier: 3 },
  { ticker: 'MCO', name: 'Moody\'s Corporation', nameKr: '무디스', tier: 3 },

  // Healthcare / Biotech
  { ticker: 'BMY', name: 'Bristol-Myers Squibb Co.', nameKr: '브리스톨마이어스', tier: 3 },
  { ticker: 'ABT', name: 'Abbott Laboratories', nameKr: '애보트', tier: 3 },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', nameKr: '써모피셔', tier: 3 },
  { ticker: 'DHR', name: 'Danaher Corporation', nameKr: '다나허', tier: 3 },
  { ticker: 'MDT', name: 'Medtronic plc', nameKr: '메드트로닉', tier: 3 },
  { ticker: 'DXCM', name: 'DexCom Inc.', nameKr: '덱스콤', tier: 3 },
  { ticker: 'ILMN', name: 'Illumina Inc.', nameKr: '일루미나', tier: 3 },
  { ticker: 'EXAS', name: 'Exact Sciences Corporation', nameKr: '이그잭트사이언스', tier: 3 },
  { ticker: 'SGEN', name: 'Seagen Inc.', nameKr: '시젠', tier: 3 },
  { ticker: 'BIIB', name: 'Biogen Inc.', nameKr: '바이오젠', tier: 3 },
  { ticker: 'CI', name: 'The Cigna Group', nameKr: '시그나', tier: 3 },
  { ticker: 'CVS', name: 'CVS Health Corporation', nameKr: 'CVS헬스', tier: 3 },
  { ticker: 'MCK', name: 'McKesson Corporation', nameKr: '맥케슨', tier: 3 },
  { ticker: 'ALNY', name: 'Alnylam Pharmaceuticals Inc.', nameKr: '알닐람', tier: 3 },
  { ticker: 'CRSP', name: 'CRISPR Therapeutics AG', nameKr: '크리스퍼', tier: 3 },
  { ticker: 'NTLA', name: 'Intellia Therapeutics Inc.', nameKr: '인텔리아', tier: 3 },
  { ticker: 'BEAM', name: 'Beam Therapeutics Inc.', nameKr: '빔테라퓨틱스', tier: 3 },
  { ticker: 'BSX', name: 'Boston Scientific Corporation', nameKr: '보스턴사이언티픽', tier: 3 },
  { ticker: 'BDX', name: 'Becton, Dickinson and Company', nameKr: '벡턴디킨슨', tier: 3 },
  { ticker: 'ALGN', name: 'Align Technology Inc.', nameKr: '얼라인테크놀로지', tier: 3 },
  { ticker: 'IDXX', name: 'IDEXX Laboratories Inc.', nameKr: '아이덱스', tier: 3 },
  { ticker: 'HCA', name: 'HCA Healthcare Inc.', nameKr: 'HCA헬스케어', tier: 3 },
  { ticker: 'IQV', name: 'IQVIA Holdings Inc.', nameKr: 'IQVIA', tier: 3 },
  { ticker: 'A', name: 'Agilent Technologies Inc.', nameKr: '애질런트', tier: 3 },
  { ticker: 'WAT', name: 'Waters Corporation', nameKr: '워터스', tier: 3 },
  { ticker: 'HOLX', name: 'Hologic Inc.', nameKr: '홀로직', tier: 3 },
  { ticker: 'TECH', name: 'Bio-Techne Corporation', nameKr: '바이오테크니', tier: 3 },
  { ticker: 'INCY', name: 'Incyte Corporation', nameKr: '인사이트', tier: 3 },
  { ticker: 'NBIX', name: 'Neurocrine Biosciences Inc.', nameKr: '뉴로크린', tier: 3 },
  { ticker: 'PCVX', name: 'Vaxcyte Inc.', nameKr: '백사이트', tier: 3 },
  { ticker: 'RARE', name: 'Ultragenyx Pharmaceutical Inc.', nameKr: '울트라제닉스', tier: 3 },
  { ticker: 'SRPT', name: 'Sarepta Therapeutics Inc.', nameKr: '사렙타', tier: 3 },
  { ticker: 'BMRN', name: 'BioMarin Pharmaceutical Inc.', nameKr: '바이오마린', tier: 3 },
  { ticker: 'HZNP', name: 'Horizon Therapeutics plc', nameKr: '호라이즌', tier: 3 },
  { ticker: 'UTHR', name: 'United Therapeutics Corp.', nameKr: '유나이티드테라퓨틱스', tier: 3 },
  { ticker: 'MRVI', name: 'Maravai LifeSciences Holdings', nameKr: '마라바이', tier: 3 },
  { ticker: 'XRAY', name: 'DENTSPLY SIRONA Inc.', nameKr: '덴츠플라이시로나', tier: 3 },
  { ticker: 'PODD', name: 'Insulet Corporation', nameKr: '인슐렛', tier: 3 },
  { ticker: 'RVMD', name: 'Revolution Medicines Inc.', nameKr: '레볼루션메디신', tier: 3 },
  { ticker: 'SYK', name: 'Stryker Corporation', nameKr: '스트라이커', tier: 3 },
  { ticker: 'ZTS', name: 'Zoetis Inc.', nameKr: '조에티스', tier: 3 },
  { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', nameKr: '버텍스', tier: 3 },
  { ticker: 'GEHC', name: 'GE HealthCare Technologies', nameKr: 'GE헬스케어', tier: 3 },
  { ticker: 'EW', name: 'Edwards Lifesciences Corp.', nameKr: '에드워즈라이프사이언스', tier: 3 },
  { ticker: 'ZBH', name: 'Zimmer Biomet Holdings Inc.', nameKr: '짐머바이오메트', tier: 3 },
  { ticker: 'RXRX', name: 'Recursion Pharmaceuticals Inc.', nameKr: '리커젼', tier: 3 },
  { ticker: 'SMMT', name: 'Summit Therapeutics Inc.', nameKr: '서밋테라퓨틱스', tier: 3 },
  { ticker: 'NVAX', name: 'Novavax Inc.', nameKr: '노바백스', tier: 3 },
  { ticker: 'DNA', name: 'Ginkgo Bioworks Holdings Inc.', nameKr: '징코바이오웍스', tier: 3 },

  // Telecom
  { ticker: 'T', name: 'AT&T Inc.', nameKr: 'AT&T', tier: 3 },
  { ticker: 'VZ', name: 'Verizon Communications Inc.', nameKr: '버라이즌', tier: 3 },
  { ticker: 'TMUS', name: 'T-Mobile US Inc.', nameKr: 'T모바일', tier: 3 },

  // China / Asia ADR
  { ticker: 'NTES', name: 'NetEase Inc.', nameKr: '넷이즈', tier: 3 },
  { ticker: 'BILI', name: 'Bilibili Inc.', nameKr: '비리비리', tier: 3 },
  { ticker: 'TAL', name: 'TAL Education Group', nameKr: 'TAL에듀케이션', tier: 3 },
  { ticker: 'TME', name: 'Tencent Music Entertainment', nameKr: '텐센트뮤직', tier: 3 },
  { ticker: 'TCOM', name: 'Trip.com Group Limited', nameKr: '트립닷컴', tier: 3 },
  { ticker: 'MNSO', name: 'MINISO Group Holding Limited', nameKr: '미니소', tier: 3 },
  { ticker: 'WB', name: 'Weibo Corporation', nameKr: '웨이보', tier: 3 },
  { ticker: 'DIDI', name: 'DiDi Global Inc.', nameKr: '디디추싱', tier: 3 },
  { ticker: 'IQ', name: 'iQIYI Inc.', nameKr: '아이치이', tier: 3 },
  { ticker: 'ZTO', name: 'ZTO Express (Cayman) Inc.', nameKr: 'ZTO익스프레스', tier: 3 },
  { ticker: 'VNET', name: 'VNET Group Inc.', nameKr: 'VNET그룹', tier: 3 },
  { ticker: 'KC', name: 'Kingsoft Cloud Holdings Limited', nameKr: '킹소프트클라우드', tier: 3 },
  { ticker: 'YUMC', name: 'Yum China Holdings Inc.', nameKr: '얌차이나', tier: 3 },
  { ticker: 'TIGR', name: 'UP Fintech Holding Limited', nameKr: '타이거브로커스', tier: 3 },

  // REITs / Infrastructure
  { ticker: 'AMT', name: 'American Tower Corporation', nameKr: '아메리칸타워', tier: 3 },
  { ticker: 'PLD', name: 'Prologis Inc.', nameKr: '프로로지스', tier: 3 },
  { ticker: 'EQIX', name: 'Equinix Inc.', nameKr: '에퀴닉스', tier: 3 },
  { ticker: 'DLR', name: 'Digital Realty Trust Inc.', nameKr: '디지털리얼티', tier: 3 },
  { ticker: 'O', name: 'Realty Income Corporation', nameKr: '리얼티인컴', tier: 3 },
  { ticker: 'SPG', name: 'Simon Property Group Inc.', nameKr: '사이먼프로퍼티', tier: 3 },
  { ticker: 'CCI', name: 'Crown Castle Inc.', nameKr: '크라운캐슬', tier: 3 },
  { ticker: 'WELL', name: 'Welltower Inc.', nameKr: '웰타워', tier: 3 },
  { ticker: 'PSA', name: 'Public Storage', nameKr: '퍼블릭스토리지', tier: 3 },
  { ticker: 'AVB', name: 'AvalonBay Communities Inc.', nameKr: '아발론베이', tier: 3 },
  { ticker: 'EQR', name: 'Equity Residential', nameKr: '에퀴티레지덴셜', tier: 3 },
  { ticker: 'ARE', name: 'Alexandria Real Estate Equities', nameKr: '알렉산드리아RE', tier: 3 },
  { ticker: 'SBAC', name: 'SBA Communications Corporation', nameKr: 'SBA커뮤니케이션스', tier: 3 },
  { ticker: 'VICI', name: 'VICI Properties Inc.', nameKr: 'VICI프로퍼티스', tier: 3 },

  // Industrial
  { ticker: 'DE', name: 'Deere & Company', nameKr: '디어앤컴퍼니', tier: 3 },
  { ticker: 'NOC', name: 'Northrop Grumman Corp.', nameKr: '노스롭그루먼', tier: 3 },
  { ticker: 'GD', name: 'General Dynamics Corp.', nameKr: '제너럴다이나믹스', tier: 3 },
  { ticker: 'HII', name: 'Huntington Ingalls Industries', nameKr: '헌팅턴인갈스', tier: 3 },
  { ticker: 'LHX', name: 'L3Harris Technologies', nameKr: 'L3해리스', tier: 3 },
  { ticker: 'TDG', name: 'TransDigm Group Inc.', nameKr: '트랜스다임', tier: 3 },
  { ticker: 'PCAR', name: 'PACCAR Inc.', nameKr: '팩카', tier: 3 },
  { ticker: 'FAST', name: 'Fastenal Company', nameKr: '패스널', tier: 3 },
  { ticker: 'ROK', name: 'Rockwell Automation Inc.', nameKr: '록웰오토메이션', tier: 3 },
  { ticker: 'EMR', name: 'Emerson Electric Co.', nameKr: '에머슨일렉트릭', tier: 3 },
  { ticker: 'ETN', name: 'Eaton Corporation plc', nameKr: '이튼', tier: 3 },
  { ticker: 'ITW', name: 'Illinois Tool Works Inc.', nameKr: '일리노이툴웍스', tier: 3 },
  { ticker: 'AXON', name: 'Axon Enterprise Inc.', nameKr: '액손엔터프라이즈', tier: 3 },
  { ticker: 'CMI', name: 'Cummins Inc.', nameKr: '커민스', tier: 3 },
  { ticker: 'PH', name: 'Parker-Hannifin Corporation', nameKr: '파커하니핀', tier: 3 },
  { ticker: 'SWK', name: 'Stanley Black & Decker Inc.', nameKr: '스탠리블랙앤데커', tier: 3 },
  { ticker: 'GWW', name: 'W.W. Grainger Inc.', nameKr: '그레인저', tier: 3 },
  { ticker: 'ODFL', name: 'Old Dominion Freight Line Inc.', nameKr: '올드도미니언', tier: 3 },
  { ticker: 'XPO', name: 'XPO Inc.', nameKr: 'XPO', tier: 3 },
  { ticker: 'JBHT', name: 'J.B. Hunt Transport Services', nameKr: 'JB헌트', tier: 3 },
  { ticker: 'URI', name: 'United Rentals Inc.', nameKr: '유나이티드렌탈', tier: 3 },
  { ticker: 'WM', name: 'Waste Management Inc.', nameKr: '웨이스트매니지먼트', tier: 3 },
  { ticker: 'RSG', name: 'Republic Services Inc.', nameKr: '리퍼블릭서비시스', tier: 3 },
  { ticker: 'VRSK', name: 'Verisk Analytics Inc.', nameKr: '베리스크', tier: 3 },
  { ticker: 'OTIS', name: 'Otis Worldwide Corporation', nameKr: '오티스', tier: 3 },
  { ticker: 'CARR', name: 'Carrier Global Corporation', nameKr: '캐리어글로벌', tier: 3 },
  { ticker: 'ROP', name: 'Roper Technologies Inc.', nameKr: '로퍼테크놀로지', tier: 3 },
  { ticker: 'CPRT', name: 'Copart Inc.', nameKr: '코파트', tier: 3 },
  { ticker: 'CTAS', name: 'Cintas Corporation', nameKr: '신타스', tier: 3 },
  { ticker: 'NSC', name: 'Norfolk Southern Corporation', nameKr: '노퍽서던', tier: 3 },
  { ticker: 'CSX', name: 'CSX Corporation', nameKr: 'CSX', tier: 3 },
  { ticker: 'UNP', name: 'Union Pacific Corporation', nameKr: '유니온퍼시픽', tier: 3 },

  // Transport
  { ticker: 'UPS', name: 'United Parcel Service Inc.', nameKr: 'UPS', tier: 3 },
  { ticker: 'FDX', name: 'FedEx Corporation', nameKr: '페덱스', tier: 3 },
  { ticker: 'DAL', name: 'Delta Air Lines Inc.', nameKr: '델타항공', tier: 3 },
  { ticker: 'UAL', name: 'United Airlines Holdings', nameKr: '유나이티드항공', tier: 3 },
  { ticker: 'LUV', name: 'Southwest Airlines Co.', nameKr: '사우스웨스트항공', tier: 3 },
  { ticker: 'AAL', name: 'American Airlines Group Inc.', nameKr: '아메리칸항공', tier: 3 },

  // Media / Entertainment
  { ticker: 'CMCSA', name: 'Comcast Corporation', nameKr: '컴캐스트', tier: 3 },
  { ticker: 'WBD', name: 'Warner Bros. Discovery', nameKr: '워너브라더스디스커버리', tier: 3 },
  { ticker: 'PARA', name: 'Paramount Global', nameKr: '파라마운트', tier: 3 },
  { ticker: 'LYV', name: 'Live Nation Entertainment', nameKr: '라이브네이션', tier: 3 },
  { ticker: 'IMAX', name: 'IMAX Corporation', nameKr: '아이맥스', tier: 3 },
  { ticker: 'VRSN', name: 'VeriSign Inc.', nameKr: '베리사인', tier: 3 },
  { ticker: 'FOX', name: 'Fox Corporation', nameKr: '폭스', tier: 3 },
  { ticker: 'NWSA', name: 'News Corp', nameKr: '뉴스코프', tier: 3 },
  { ticker: 'CHTR', name: 'Charter Communications Inc.', nameKr: '차터커뮤니케이션스', tier: 3 },
  { ticker: 'LBRDK', name: 'Liberty Broadband Corporation', nameKr: '리버티브로드밴드', tier: 3 },
  { ticker: 'SIRI', name: 'Sirius XM Holdings Inc.', nameKr: '시리우스XM', tier: 3 },

  // Utilities
  { ticker: 'SO', name: 'The Southern Company', nameKr: '서던컴퍼니', tier: 3 },
  { ticker: 'DUK', name: 'Duke Energy Corporation', nameKr: '듀크에너지', tier: 3 },
  { ticker: 'SRE', name: 'Sempra', nameKr: '셈프라', tier: 3 },
  { ticker: 'ED', name: 'Consolidated Edison Inc.', nameKr: '컨솔리데이티드에디슨', tier: 3 },
  { ticker: 'XEL', name: 'Xcel Energy Inc.', nameKr: '엑셀에너지', tier: 3 },
  { ticker: 'AEP', name: 'American Electric Power Co.', nameKr: '아메리칸일렉트릭파워', tier: 3 },
  { ticker: 'D', name: 'Dominion Energy Inc.', nameKr: '도미니언에너지', tier: 3 },
  { ticker: 'EXC', name: 'Exelon Corporation', nameKr: '엑셀론', tier: 3 },
  { ticker: 'WEC', name: 'WEC Energy Group Inc.', nameKr: 'WEC에너지', tier: 3 },
  { ticker: 'ES', name: 'Eversource Energy', nameKr: '에버소스에너지', tier: 3 },
  { ticker: 'PCG', name: 'PG&E Corporation', nameKr: 'PG&E', tier: 3 },

  // Materials
  { ticker: 'FCX', name: 'Freeport-McMoRan Inc.', nameKr: '프리포트맥모란', tier: 3 },
  { ticker: 'NEM', name: 'Newmont Corporation', nameKr: '뉴몬트', tier: 3 },
  { ticker: 'LIN', name: 'Linde plc', nameKr: '린데', tier: 3 },
  { ticker: 'APD', name: 'Air Products and Chemicals', nameKr: '에어프로덕츠', tier: 3 },
  { ticker: 'DOW', name: 'Dow Inc.', nameKr: '다우', tier: 3 },
  { ticker: 'PPG', name: 'PPG Industries Inc.', nameKr: 'PPG인더스트리즈', tier: 3 },
  { ticker: 'SHW', name: 'The Sherwin-Williams Company', nameKr: '셔윈윌리엄스', tier: 3 },
  { ticker: 'ECL', name: 'Ecolab Inc.', nameKr: '에코랩', tier: 3 },
  { ticker: 'VMC', name: 'Vulcan Materials Company', nameKr: '벌칸머티리얼즈', tier: 3 },
  { ticker: 'MLM', name: 'Martin Marietta Materials Inc.', nameKr: '마틴마리에타', tier: 3 },
  { ticker: 'DD', name: 'DuPont de Nemours Inc.', nameKr: '듀폰', tier: 3 },
  { ticker: 'EMN', name: 'Eastman Chemical Company', nameKr: '이스트만케미컬', tier: 3 },
  { ticker: 'ALB', name: 'Albemarle Corporation', nameKr: '앨버말', tier: 3 },

  // Large-cap value
  { ticker: 'MMM', name: '3M Company', nameKr: '3M', tier: 3 },
  { ticker: 'ADP', name: 'Automatic Data Processing Inc.', nameKr: 'ADP', tier: 3 },
  { ticker: 'PAYX', name: 'Paychex Inc.', nameKr: '페이첵스', tier: 3 },

  // Gaming / Metaverse (remaining)
  { ticker: 'GRAB', name: 'Grab Holdings Limited', nameKr: '그랩', tier: 3 },

  // Cannabis / Meme (remaining)
  { ticker: 'TLRY', name: 'Tilray Brands Inc.', nameKr: '틸레이', tier: 3 },
  { ticker: 'SPCE', name: 'Virgin Galactic Holdings', nameKr: '버진갤럭틱', tier: 3 },

  // Other growth
  { ticker: 'CIFR', name: 'Cipher Mining Inc.', nameKr: '사이퍼마이닝', tier: 3 },
  { ticker: 'WULF', name: 'TeraWulf Inc.', nameKr: '테라울프', tier: 3 },
  { ticker: 'BTDR', name: 'Bitdeer Technologies Group', nameKr: '비트디어', tier: 3 },
  { ticker: 'AEHR', name: 'Aehr Test Systems', nameKr: '아에르테스트', tier: 3 },
  { ticker: 'APLD', name: 'Applied Digital Corporation', nameKr: '어플라이드디지털', tier: 3 },
  { ticker: 'OPEN', name: 'Opendoor Technologies Inc.', nameKr: '오픈도어', tier: 3 },
  { ticker: 'NNE', name: 'Nano Nuclear Energy Inc.', nameKr: '나노뉴클리어에너지', tier: 3 },
  { ticker: 'BIRD', name: 'Allbirds Inc.', nameKr: '올버즈', tier: 3 },
  { ticker: 'BROS', name: 'Dutch Bros Inc.', nameKr: '더치브로스', tier: 3 },
  { ticker: 'TOST', name: 'Toast Inc.', nameKr: '토스트', tier: 3 },
  { ticker: 'GLBE', name: 'Global-E Online Ltd.', nameKr: '글로벌이온라인', tier: 3 },
  { ticker: 'LUNR', name: 'Intuitive Machines Inc.', nameKr: '인튜이티브머신스', tier: 3 },

  // ─── ETFs (isEtf: true) ───

  // Major Index ETFs
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', nameKr: 'S&P500 ETF', tier: 3, isEtf: true },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', nameKr: '나스닥100 ETF', tier: 3, isEtf: true },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', nameKr: 'S&P500 ETF(뱅가드)', tier: 3, isEtf: true },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', nameKr: '미국전체주식 ETF', tier: 3, isEtf: true },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', nameKr: '러셀2000 ETF', tier: 3, isEtf: true },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', nameKr: '다우존스 ETF', tier: 3, isEtf: true },
  { ticker: 'SPLG', name: 'SPDR Portfolio S&P 500 ETF', nameKr: 'S&P500 저비용 ETF', tier: 3, isEtf: true },

  // ARK ETFs
  { ticker: 'ARKK', name: 'ARK Innovation ETF', nameKr: 'ARK 혁신 ETF', tier: 3, isEtf: true },
  { ticker: 'ARKG', name: 'ARK Genomic Revolution ETF', nameKr: 'ARK 유전체혁명 ETF', tier: 3, isEtf: true },
  { ticker: 'ARKW', name: 'ARK Next Generation Internet ETF', nameKr: 'ARK 차세대인터넷 ETF', tier: 3, isEtf: true },
  { ticker: 'ARKF', name: 'ARK Fintech Innovation ETF', nameKr: 'ARK 핀테크 ETF', tier: 3, isEtf: true },
  { ticker: 'ARKQ', name: 'ARK Autonomous Technology & Robotics ETF', nameKr: 'ARK 자율기술 ETF', tier: 3, isEtf: true },

  // Leverage / Inverse ETFs
  { ticker: 'SOXL', name: 'Direxion Semiconductor Bull 3X', nameKr: '반도체 3배 레버리지', tier: 3, isEtf: true },
  { ticker: 'TQQQ', name: 'ProShares UltraPro QQQ', nameKr: '나스닥 3배 레버리지', tier: 3, isEtf: true },
  { ticker: 'SOXS', name: 'Direxion Semiconductor Bear 3X', nameKr: '반도체 3배 인버스', tier: 3, isEtf: true },
  { ticker: 'SQQQ', name: 'ProShares UltraPro Short QQQ', nameKr: '나스닥 3배 인버스', tier: 3, isEtf: true },
  { ticker: 'UPRO', name: 'ProShares UltraPro S&P500', nameKr: 'S&P500 3배 레버리지', tier: 3, isEtf: true },
  { ticker: 'SPXU', name: 'ProShares UltraPro Short S&P500', nameKr: 'S&P500 3배 인버스', tier: 3, isEtf: true },
  { ticker: 'UVXY', name: 'ProShares Ultra VIX Short-Term Futures ETF', nameKr: 'VIX 1.5배 레버리지', tier: 3, isEtf: true },
  { ticker: 'SVXY', name: 'ProShares Short VIX Short-Term Futures ETF', nameKr: 'VIX 인버스', tier: 3, isEtf: true },
  { ticker: 'LABU', name: 'Direxion Daily S&P Biotech Bull 3X', nameKr: '바이오 3배 레버리지', tier: 3, isEtf: true },
  { ticker: 'LABD', name: 'Direxion Daily S&P Biotech Bear 3X', nameKr: '바이오 3배 인버스', tier: 3, isEtf: true },
  { ticker: 'FNGU', name: 'MicroSectors FANG+ Index 3X Leveraged ETN', nameKr: 'FANG+ 3배 레버리지', tier: 3, isEtf: true },
  { ticker: 'FNGD', name: 'MicroSectors FANG+ Index -3X Inverse Leveraged ETN', nameKr: 'FANG+ 3배 인버스', tier: 3, isEtf: true },

  // Dividend ETFs
  { ticker: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', nameKr: 'SCHD 배당 ETF', tier: 3, isEtf: true },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', nameKr: 'JEPI 커버드콜 ETF', tier: 3, isEtf: true },
  { ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', nameKr: '배당성장 ETF', tier: 3, isEtf: true },
  { ticker: 'DVY', name: 'iShares Select Dividend ETF', nameKr: '배당주 ETF', tier: 3, isEtf: true },
  { ticker: 'HDV', name: 'iShares Core High Dividend ETF', nameKr: '고배당 ETF', tier: 3, isEtf: true },
  { ticker: 'DIVO', name: 'Amplify CWP Enhanced Dividend Income ETF', nameKr: 'DIVO 배당인컴 ETF', tier: 3, isEtf: true },
  { ticker: 'QYLD', name: 'Global X NASDAQ 100 Covered Call ETF', nameKr: '나스닥커버드콜 ETF', tier: 3, isEtf: true },
  { ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', nameKr: 'JEPQ 나스닥커버드콜 ETF', tier: 3, isEtf: true },

  // Sector ETFs
  { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund', nameKr: '금융섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR Fund', nameKr: '에너지섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund', nameKr: '기술섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR Fund', nameKr: '헬스케어섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLI', name: 'Industrial Select Sector SPDR Fund', nameKr: '산업섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLC', name: 'Communication Services Select Sector SPDR Fund', nameKr: '통신섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund', nameKr: '필수소비재 ETF', tier: 3, isEtf: true },
  { ticker: 'XLU', name: 'Utilities Select Sector SPDR Fund', nameKr: '유틸리티섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLB', name: 'Materials Select Sector SPDR Fund', nameKr: '소재섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XLRE', name: 'Real Estate Select Sector SPDR Fund', nameKr: '부동산섹터 ETF', tier: 3, isEtf: true },
  { ticker: 'XBI', name: 'SPDR S&P Biotech ETF', nameKr: '바이오테크 ETF', tier: 3, isEtf: true },

  // Bond ETFs
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', nameKr: '미국장기국채 ETF', tier: 3, isEtf: true },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', nameKr: '미국전체채권 ETF', tier: 3, isEtf: true },
  { ticker: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', nameKr: '미국종합채권 ETF', tier: 3, isEtf: true },
  { ticker: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF', nameKr: '하이일드채권 ETF', tier: 3, isEtf: true },
  { ticker: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF', nameKr: '투자등급회사채 ETF', tier: 3, isEtf: true },
  { ticker: 'TIP', name: 'iShares TIPS Bond ETF', nameKr: '물가연동채 ETF', tier: 3, isEtf: true },
  { ticker: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', nameKr: '미국단기국채 ETF', tier: 3, isEtf: true },
  { ticker: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', nameKr: '미국중기국채 ETF', tier: 3, isEtf: true },

  // Commodity ETFs
  { ticker: 'GLD', name: 'SPDR Gold Shares', nameKr: '금 ETF', tier: 3, isEtf: true },
  { ticker: 'SLV', name: 'iShares Silver Trust', nameKr: '은 ETF', tier: 3, isEtf: true },
  { ticker: 'USO', name: 'United States Oil Fund', nameKr: '원유 ETF', tier: 3, isEtf: true },
  { ticker: 'UNG', name: 'United States Natural Gas Fund', nameKr: '천연가스 ETF', tier: 3, isEtf: true },
  { ticker: 'PDBC', name: 'Invesco Optimum Yield Diversified Commodity Strategy', nameKr: '원자재종합 ETF', tier: 3, isEtf: true },
  { ticker: 'DBA', name: 'Invesco DB Agriculture Fund', nameKr: '농산물 ETF', tier: 3, isEtf: true },

  // International ETFs
  { ticker: 'EEM', name: 'iShares MSCI Emerging Markets ETF', nameKr: '신흥국 ETF', tier: 3, isEtf: true },
  { ticker: 'EFA', name: 'iShares MSCI EAFE ETF', nameKr: '선진국(미국제외) ETF', tier: 3, isEtf: true },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', nameKr: '신흥국 ETF(뱅가드)', tier: 3, isEtf: true },
  { ticker: 'INDA', name: 'iShares MSCI India ETF', nameKr: '인도 ETF', tier: 3, isEtf: true },
  { ticker: 'MCHI', name: 'iShares MSCI China ETF', nameKr: '중국 ETF', tier: 3, isEtf: true },
  { ticker: 'KWEB', name: 'KraneShares CSI China Internet ETF', nameKr: '중국인터넷 ETF', tier: 3, isEtf: true },

  // Thematic ETFs
  { ticker: 'BOTZ', name: 'Global X Robotics & Artificial Intelligence ETF', nameKr: '로봇/AI ETF', tier: 3, isEtf: true },
  { ticker: 'ROBO', name: 'ROBO Global Robotics and Automation Index ETF', nameKr: '로보틱스 ETF', tier: 3, isEtf: true },
  { ticker: 'HACK', name: 'ETFMG Prime Cyber Security ETF', nameKr: '사이버보안 ETF', tier: 3, isEtf: true },
  { ticker: 'TAN', name: 'Invesco Solar ETF', nameKr: '태양광 ETF', tier: 3, isEtf: true },
  { ticker: 'LIT', name: 'Global X Lithium & Battery Tech ETF', nameKr: '리튬/배터리 ETF', tier: 3, isEtf: true },
  { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', nameKr: '글로벌클린에너지 ETF', tier: 3, isEtf: true },
  { ticker: 'SMH', name: 'VanEck Semiconductor ETF', nameKr: '반도체 ETF(반에크)', tier: 3, isEtf: true },
  { ticker: 'SOXX', name: 'iShares Semiconductor ETF', nameKr: '반도체 ETF(아이셰어즈)', tier: 3, isEtf: true },

  // Crypto ETFs
  { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', nameKr: '비트코인 ETF(블랙록)', tier: 3, isEtf: true },
  { ticker: 'FBTC', name: 'Fidelity Wise Origin Bitcoin Fund', nameKr: '비트코인 ETF(피델리티)', tier: 3, isEtf: true },
  { ticker: 'BITB', name: 'Bitwise Bitcoin ETF', nameKr: '비트코인 ETF(비트와이즈)', tier: 3, isEtf: true },
];

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/** 모든 티어의 종목을 합쳐서 반환 */
export function getAllStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS, ...TIER3_STOCKS];
}

/** 특정 티어의 종목만 반환 */
export function getStocksByTier(tier: 1 | 2 | 3): TieredStock[] {
  switch (tier) {
    case 1:
      return TIER1_STOCKS;
    case 2:
      return TIER2_STOCKS;
    case 3:
      return TIER3_STOCKS;
    default:
      return [];
  }
}

/** 티커로 해당 종목의 티어를 조회 (없으면 null) */
export function getTierForTicker(ticker: string): 1 | 2 | 3 | null {
  const upperTicker = ticker.toUpperCase();
  const stock = getAllStocks().find((s) => s.ticker === upperTicker);
  return stock ? stock.tier : null;
}

/** Tier 1+2 개별주식만 반환 (AI 분석 대상) */
export function getAnalysisTargetStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS].filter(s => !s.isEtf);
}

/** 전체 수집 대상 (Tier 1 + 2, 6종 API) — ETF 제외 */
export function getFullCollectionStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS].filter(s => !s.isEtf);
}

/** 기본 수집 대상 (Tier 3, quote+news만) */
export function getBasicCollectionStocks(): TieredStock[] {
  return TIER3_STOCKS;
}

/** ETF 여부 확인 */
export function isEtfTicker(ticker: string): boolean {
  const all = getAllStocks();
  return all.find(s => s.ticker === ticker.toUpperCase())?.isEtf === true;
}
