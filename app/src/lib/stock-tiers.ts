// stock-tiers.ts
// 한국 개인투자자 인기 미국 주식 티어 분류
// Tier 1: 최다 거래 인기 종목 50개
// Tier 2: 관심도 높은 확장 종목 200개
// Tier 3: DB 관리 (동적 확장)

export interface TieredStock {
  ticker: string;
  name: string;
  nameKr: string;
  tier: 1 | 2 | 3;
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
// Tier 2: 관심도 높은 확장 종목 (200개)
// ─────────────────────────────────────────────
export const TIER2_STOCKS: TieredStock[] = [
  // Tier 1에서 이동한 종목 (3)
  { ticker: 'RBLX', name: 'Roblox Corporation', nameKr: '로블록스', tier: 2 },
  { ticker: 'ROKU', name: 'Roku Inc.', nameKr: '로쿠', tier: 2 },
  { ticker: 'SNAP', name: 'Snap Inc.', nameKr: '스냅', tier: 2 },

  // Semiconductors 추가 (10)
  { ticker: 'ASML', name: 'ASML Holding N.V.', nameKr: 'ASML', tier: 2 },
  { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing', nameKr: 'TSMC', tier: 2 },
  { ticker: 'LRCX', name: 'Lam Research Corporation', nameKr: '램리서치', tier: 2 },
  { ticker: 'AMAT', name: 'Applied Materials Inc.', nameKr: '어플라이드머티리얼즈', tier: 2 },
  { ticker: 'KLAC', name: 'KLA Corporation', nameKr: 'KLA', tier: 2 },
  { ticker: 'TXN', name: 'Texas Instruments Inc.', nameKr: '텍사스인스트루먼트', tier: 2 },
  { ticker: 'ON', name: 'ON Semiconductor Corp.', nameKr: 'ON세미컨덕터', tier: 2 },
  { ticker: 'MRVL', name: 'Marvell Technology Inc.', nameKr: '마벨테크놀로지', tier: 2 },
  { ticker: 'GFS', name: 'GlobalFoundries Inc.', nameKr: '글로벌파운드리스', tier: 2 },
  { ticker: 'WOLF', name: 'Wolfspeed Inc.', nameKr: '울프스피드', tier: 2 },

  // Software / Cloud (26)
  { ticker: 'ADBE', name: 'Adobe Inc.', nameKr: '어도비', tier: 2 },
  { ticker: 'NOW', name: 'ServiceNow Inc.', nameKr: '서비스나우', tier: 2 },
  { ticker: 'INTU', name: 'Intuit Inc.', nameKr: '인튜이트', tier: 2 },
  { ticker: 'PANW', name: 'Palo Alto Networks Inc.', nameKr: '팔로알토네트웍스', tier: 2 },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings Inc.', nameKr: '크라우드스트라이크', tier: 2 },
  { ticker: 'SNOW', name: 'Snowflake Inc.', nameKr: '스노우플레이크', tier: 2 },
  { ticker: 'NET', name: 'Cloudflare Inc.', nameKr: '클라우드플레어', tier: 2 },
  { ticker: 'DDOG', name: 'Datadog Inc.', nameKr: '데이터독', tier: 2 },
  { ticker: 'ZS', name: 'Zscaler Inc.', nameKr: '지스케일러', tier: 2 },
  { ticker: 'OKTA', name: 'Okta Inc.', nameKr: '옥타', tier: 2 },
  { ticker: 'MDB', name: 'MongoDB Inc.', nameKr: '몽고DB', tier: 2 },
  { ticker: 'SPLK', name: 'Splunk Inc.', nameKr: '스플렁크', tier: 2 },
  { ticker: 'TEAM', name: 'Atlassian Corporation', nameKr: '아틀라시안', tier: 2 },
  { ticker: 'WDAY', name: 'Workday Inc.', nameKr: '워크데이', tier: 2 },
  { ticker: 'HUBS', name: 'HubSpot Inc.', nameKr: '허브스팟', tier: 2 },
  { ticker: 'VEEV', name: 'Veeva Systems Inc.', nameKr: '비바시스템즈', tier: 2 },
  { ticker: 'BILL', name: 'BILL Holdings Inc.', nameKr: '빌홀딩스', tier: 2 },
  { ticker: 'CFLT', name: 'Confluent Inc.', nameKr: '컨플루언트', tier: 2 },
  { ticker: 'PATH', name: 'UiPath Inc.', nameKr: '유아이패스', tier: 2 },
  { ticker: 'DOCN', name: 'DigitalOcean Holdings Inc.', nameKr: '디지털오션', tier: 2 },
  { ticker: 'ESTC', name: 'Elastic N.V.', nameKr: '엘라스틱', tier: 2 },
  { ticker: 'GTLB', name: 'GitLab Inc.', nameKr: '깃랩', tier: 2 },
  { ticker: 'S', name: 'SentinelOne Inc.', nameKr: '센티넬원', tier: 2 },
  { ticker: 'MNDY', name: 'monday.com Ltd.', nameKr: '먼데이닷컴', tier: 2 },
  { ticker: 'PCOR', name: 'Procore Technologies Inc.', nameKr: '프로코어', tier: 2 },
  { ticker: 'ZI', name: 'ZoomInfo Technologies Inc.', nameKr: '줌인포', tier: 2 },

  // Social / Internet (13) — ROKU는 위에서 이미 포함
  { ticker: 'PINS', name: 'Pinterest Inc.', nameKr: '핀터레스트', tier: 2 },
  { ticker: 'LYFT', name: 'Lyft Inc.', nameKr: '리프트', tier: 2 },
  { ticker: 'MTCH', name: 'Match Group Inc.', nameKr: '매치그룹', tier: 2 },
  { ticker: 'SPOT', name: 'Spotify Technology S.A.', nameKr: '스포티파이', tier: 2 },
  { ticker: 'TWLO', name: 'Twilio Inc.', nameKr: '트윌리오', tier: 2 },
  { ticker: 'TTD', name: 'The Trade Desk Inc.', nameKr: '트레이드데스크', tier: 2 },
  { ticker: 'ETSY', name: 'Etsy Inc.', nameKr: '엣시', tier: 2 },
  { ticker: 'CHWY', name: 'Chewy Inc.', nameKr: '츄이', tier: 2 },
  { ticker: 'W', name: 'Wayfair Inc.', nameKr: '웨이페어', tier: 2 },
  { ticker: 'DASH', name: 'DoorDash Inc.', nameKr: '도어대시', tier: 2 },
  { ticker: 'DKNG', name: 'DraftKings Inc.', nameKr: '드래프트킹스', tier: 2 },
  { ticker: 'PENN', name: 'PENN Entertainment Inc.', nameKr: 'PENN엔터테인먼트', tier: 2 },

  // EV / Auto (6)
  { ticker: 'RIVN', name: 'Rivian Automotive Inc.', nameKr: '리비안', tier: 2 },
  { ticker: 'LCID', name: 'Lucid Group Inc.', nameKr: '루시드', tier: 2 },
  { ticker: 'F', name: 'Ford Motor Company', nameKr: '포드', tier: 2 },
  { ticker: 'GM', name: 'General Motors Company', nameKr: 'GM(제너럴모터스)', tier: 2 },
  { ticker: 'LI', name: 'Li Auto Inc.', nameKr: '리오토', tier: 2 },
  { ticker: 'XPEV', name: 'XPeng Inc.', nameKr: '샤오펑', tier: 2 },

  // Finance 추가 (11)
  { ticker: 'WFC', name: 'Wells Fargo & Company', nameKr: '웰스파고', tier: 2 },
  { ticker: 'GS', name: 'The Goldman Sachs Group', nameKr: '골드만삭스', tier: 2 },
  { ticker: 'MS', name: 'Morgan Stanley', nameKr: '모건스탠리', tier: 2 },
  { ticker: 'C', name: 'Citigroup Inc.', nameKr: '시티그룹', tier: 2 },
  { ticker: 'AXP', name: 'American Express Company', nameKr: '아메리칸익스프레스', tier: 2 },
  { ticker: 'SCHW', name: 'Charles Schwab Corporation', nameKr: '찰스슈왑', tier: 2 },
  { ticker: 'BLK', name: 'BlackRock Inc.', nameKr: '블랙록', tier: 2 },
  { ticker: 'SPGI', name: 'S&P Global Inc.', nameKr: 'S&P글로벌', tier: 2 },
  { ticker: 'CME', name: 'CME Group Inc.', nameKr: 'CME그룹', tier: 2 },
  { ticker: 'ICE', name: 'Intercontinental Exchange', nameKr: 'ICE', tier: 2 },
  { ticker: 'HOOD', name: 'Robinhood Markets Inc.', nameKr: '로빈후드', tier: 2 },

  // Healthcare / Biotech (14)
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc.', nameKr: '인튜이티브서지컬', tier: 2 },
  { ticker: 'REGN', name: 'Regeneron Pharmaceuticals', nameKr: '리제네론', tier: 2 },
  { ticker: 'GILD', name: 'Gilead Sciences Inc.', nameKr: '길리어드사이언스', tier: 2 },
  { ticker: 'ABBV', name: 'AbbVie Inc.', nameKr: '애브비', tier: 2 },
  { ticker: 'BMY', name: 'Bristol-Myers Squibb Co.', nameKr: '브리스톨마이어스', tier: 2 },
  { ticker: 'ABT', name: 'Abbott Laboratories', nameKr: '애보트', tier: 2 },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', nameKr: '써모피셔', tier: 2 },
  { ticker: 'DHR', name: 'Danaher Corporation', nameKr: '다나허', tier: 2 },
  { ticker: 'MDT', name: 'Medtronic plc', nameKr: '메드트로닉', tier: 2 },
  { ticker: 'DXCM', name: 'DexCom Inc.', nameKr: '덱스콤', tier: 2 },
  { ticker: 'ILMN', name: 'Illumina Inc.', nameKr: '일루미나', tier: 2 },
  { ticker: 'EXAS', name: 'Exact Sciences Corporation', nameKr: '이그잭트사이언스', tier: 2 },
  { ticker: 'SGEN', name: 'Seagen Inc.', nameKr: '시젠', tier: 2 },
  { ticker: 'BIIB', name: 'Biogen Inc.', nameKr: '바이오젠', tier: 2 },

  // Telecom (3)
  { ticker: 'T', name: 'AT&T Inc.', nameKr: 'AT&T', tier: 2 },
  { ticker: 'VZ', name: 'Verizon Communications Inc.', nameKr: '버라이즌', tier: 2 },
  { ticker: 'TMUS', name: 'T-Mobile US Inc.', nameKr: 'T모바일', tier: 2 },

  // Enterprise IT (6)
  { ticker: 'ORCL', name: 'Oracle Corporation', nameKr: '오라클', tier: 2 },
  { ticker: 'IBM', name: 'International Business Machines', nameKr: 'IBM', tier: 2 },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', nameKr: '시스코', tier: 2 },
  { ticker: 'DELL', name: 'Dell Technologies Inc.', nameKr: '델', tier: 2 },
  { ticker: 'HPQ', name: 'HP Inc.', nameKr: 'HP', tier: 2 },
  { ticker: 'HPE', name: 'Hewlett Packard Enterprise', nameKr: 'HPE', tier: 2 },

  // Consumer 추가 (9)
  { ticker: 'PG', name: 'Procter & Gamble Co.', nameKr: 'P&G', tier: 2 },
  { ticker: 'MCD', name: "McDonald's Corporation", nameKr: '맥도날드', tier: 2 },
  { ticker: 'SBUX', name: 'Starbucks Corporation', nameKr: '스타벅스', tier: 2 },
  { ticker: 'TGT', name: 'Target Corporation', nameKr: '타겟', tier: 2 },
  { ticker: 'LOW', name: "Lowe's Companies Inc.", nameKr: '로우스', tier: 2 },
  { ticker: 'TJX', name: 'The TJX Companies Inc.', nameKr: 'TJX', tier: 2 },
  { ticker: 'ROST', name: 'Ross Stores Inc.', nameKr: '로스스토어스', tier: 2 },
  { ticker: 'LULU', name: 'Lululemon Athletica Inc.', nameKr: '룰루레몬', tier: 2 },
  { ticker: 'GPS', name: 'Gap Inc.', nameKr: '갭', tier: 2 },

  // Energy 추가 (8)
  { ticker: 'OXY', name: 'Occidental Petroleum Corp.', nameKr: '옥시덴탈페트롤리엄', tier: 2 },
  { ticker: 'SLB', name: 'Schlumberger Limited', nameKr: '슐룸버거', tier: 2 },
  { ticker: 'EOG', name: 'EOG Resources Inc.', nameKr: 'EOG리소시스', tier: 2 },
  { ticker: 'DVN', name: 'Devon Energy Corporation', nameKr: '데본에너지', tier: 2 },
  { ticker: 'FANG', name: 'Diamondback Energy Inc.', nameKr: '다이아몬드백에너지', tier: 2 },
  { ticker: 'MPC', name: 'Marathon Petroleum Corp.', nameKr: '마라톤페트롤리엄', tier: 2 },
  { ticker: 'VLO', name: 'Valero Energy Corporation', nameKr: '발레로에너지', tier: 2 },
  { ticker: 'PSX', name: 'Phillips 66', nameKr: '필립스66', tier: 2 },

  // REITs / Infrastructure (6)
  { ticker: 'AMT', name: 'American Tower Corporation', nameKr: '아메리칸타워', tier: 2 },
  { ticker: 'PLD', name: 'Prologis Inc.', nameKr: '프로로지스', tier: 2 },
  { ticker: 'EQIX', name: 'Equinix Inc.', nameKr: '에퀴닉스', tier: 2 },
  { ticker: 'DLR', name: 'Digital Realty Trust Inc.', nameKr: '디지털리얼티', tier: 2 },
  { ticker: 'O', name: 'Realty Income Corporation', nameKr: '리얼티인컴', tier: 2 },
  { ticker: 'SPG', name: 'Simon Property Group Inc.', nameKr: '사이먼프로퍼티', tier: 2 },

  // Industrial (7)
  { ticker: 'CAT', name: 'Caterpillar Inc.', nameKr: '캐터필러', tier: 2 },
  { ticker: 'DE', name: 'Deere & Company', nameKr: '디어앤컴퍼니', tier: 2 },
  { ticker: 'HON', name: 'Honeywell International Inc.', nameKr: '허니웰', tier: 2 },
  { ticker: 'GE', name: 'GE Aerospace', nameKr: 'GE에어로스페이스', tier: 2 },
  { ticker: 'RTX', name: 'RTX Corporation', nameKr: 'RTX(레이시온)', tier: 2 },
  { ticker: 'LMT', name: 'Lockheed Martin Corporation', nameKr: '록히드마틴', tier: 2 },
  { ticker: 'NOC', name: 'Northrop Grumman Corp.', nameKr: '노스롭그루먼', tier: 2 },

  // Media / Entertainment (5)
  { ticker: 'CMCSA', name: 'Comcast Corporation', nameKr: '컴캐스트', tier: 2 },
  { ticker: 'WBD', name: 'Warner Bros. Discovery', nameKr: '워너브라더스디스커버리', tier: 2 },
  { ticker: 'PARA', name: 'Paramount Global', nameKr: '파라마운트', tier: 2 },
  { ticker: 'LYV', name: 'Live Nation Entertainment', nameKr: '라이브네이션', tier: 2 },
  { ticker: 'IMAX', name: 'IMAX Corporation', nameKr: '아이맥스', tier: 2 },

  // ETF-like — 한국 투자자 인기 레버리지/테마 ETF (5)
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', nameKr: 'S&P500 ETF', tier: 2 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', nameKr: '나스닥100 ETF', tier: 2 },
  { ticker: 'ARKK', name: 'ARK Innovation ETF', nameKr: 'ARK 혁신 ETF', tier: 2 },
  { ticker: 'SOXL', name: 'Direxion Semiconductor Bull 3X', nameKr: '반도체 3배 레버리지', tier: 2 },
  { ticker: 'TQQQ', name: 'ProShares UltraPro QQQ', nameKr: '나스닥 3배 레버리지', tier: 2 },

  // Cannabis / Meme (4)
  { ticker: 'GME', name: 'GameStop Corp.', nameKr: '게임스탑', tier: 2 },
  { ticker: 'AMC', name: 'AMC Entertainment Holdings', nameKr: 'AMC엔터테인먼트', tier: 2 },
  { ticker: 'TLRY', name: 'Tilray Brands Inc.', nameKr: '틸레이', tier: 2 },
  { ticker: 'SPCE', name: 'Virgin Galactic Holdings', nameKr: '버진갤럭틱', tier: 2 },

  // AI / Robotics (5)
  { ticker: 'UPST', name: 'Upstart Holdings Inc.', nameKr: '업스타트', tier: 2 },
  { ticker: 'AI', name: 'C3.ai Inc.', nameKr: 'C3.ai', tier: 2 },
  { ticker: 'BBAI', name: 'BigBear.ai Holdings', nameKr: '빅베어AI', tier: 2 },
  { ticker: 'RGTI', name: 'Rigetti Computing Inc.', nameKr: '리게티컴퓨팅', tier: 2 },
  { ticker: 'QUBT', name: 'Quantum Computing Inc.', nameKr: '퀀텀컴퓨팅', tier: 2 },

  // ─── 추가 확장 종목 (한국 투자자 인기) ───

  // 추가 ETF (한투/키움 거래량 상위) (10)
  { ticker: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', nameKr: 'SCHD 배당 ETF', tier: 2 },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', nameKr: 'JEPI 커버드콜 ETF', tier: 2 },
  { ticker: 'SOXS', name: 'Direxion Semiconductor Bear 3X', nameKr: '반도체 3배 인버스', tier: 2 },
  { ticker: 'SQQQ', name: 'ProShares UltraPro Short QQQ', nameKr: '나스닥 3배 인버스', tier: 2 },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', nameKr: 'S&P500 ETF(뱅가드)', tier: 2 },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', nameKr: '미국전체주식 ETF', tier: 2 },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', nameKr: '러셀2000 ETF', tier: 2 },
  { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund', nameKr: '금융섹터 ETF', tier: 2 },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR Fund', nameKr: '에너지섹터 ETF', tier: 2 },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund', nameKr: '기술섹터 ETF', tier: 2 },

  // 추가 중국주 (한국 투자자 관심) (8)
  { ticker: 'JD', name: 'JD.com Inc.', nameKr: '징둥', tier: 2 },
  { ticker: 'PDD', name: 'PDD Holdings Inc.', nameKr: 'PDD(핀둬둬)', tier: 2 },
  { ticker: 'BIDU', name: 'Baidu Inc.', nameKr: '바이두', tier: 2 },
  { ticker: 'NTES', name: 'NetEase Inc.', nameKr: '넷이즈', tier: 2 },
  { ticker: 'BILI', name: 'Bilibili Inc.', nameKr: '비리비리', tier: 2 },
  { ticker: 'FUTU', name: 'Futu Holdings Limited', nameKr: '푸투홀딩스', tier: 2 },
  { ticker: 'TAL', name: 'TAL Education Group', nameKr: 'TAL에듀케이션', tier: 2 },
  { ticker: 'TME', name: 'Tencent Music Entertainment', nameKr: '텐센트뮤직', tier: 2 },

  // 추가 소비재/리테일 (6)
  { ticker: 'EL', name: 'The Estee Lauder Companies', nameKr: '에스티로더', tier: 2 },
  { ticker: 'CPNG', name: 'Coupang Inc.', nameKr: '쿠팡', tier: 2 },
  { ticker: 'YUM', name: 'Yum! Brands Inc.', nameKr: '얌브랜즈', tier: 2 },
  { ticker: 'CMG', name: 'Chipotle Mexican Grill', nameKr: '치폴레', tier: 2 },
  { ticker: 'MNST', name: 'Monster Beverage Corporation', nameKr: '몬스터비버리지', tier: 2 },

  // 추가 클린에너지/신재생 (8)
  { ticker: 'ENPH', name: 'Enphase Energy Inc.', nameKr: '엔페이즈에너지', tier: 2 },
  { ticker: 'SEDG', name: 'SolarEdge Technologies', nameKr: '솔라엣지', tier: 2 },
  { ticker: 'FSLR', name: 'First Solar Inc.', nameKr: '퍼스트솔라', tier: 2 },
  { ticker: 'RUN', name: 'Sunrun Inc.', nameKr: '선런', tier: 2 },
  { ticker: 'PLUG', name: 'Plug Power Inc.', nameKr: '플러그파워', tier: 2 },
  { ticker: 'BE', name: 'Bloom Energy Corporation', nameKr: '블룸에너지', tier: 2 },
  { ticker: 'NEE', name: 'NextEra Energy Inc.', nameKr: '넥스트에라에너지', tier: 2 },
  { ticker: 'AES', name: 'The AES Corporation', nameKr: 'AES', tier: 2 },

  // 추가 방산/항공우주 (4)
  { ticker: 'GD', name: 'General Dynamics Corp.', nameKr: '제너럴다이나믹스', tier: 2 },
  { ticker: 'HII', name: 'Huntington Ingalls Industries', nameKr: '헌팅턴인갈스', tier: 2 },
  { ticker: 'LHX', name: 'L3Harris Technologies', nameKr: 'L3해리스', tier: 2 },
  { ticker: 'TDG', name: 'TransDigm Group Inc.', nameKr: '트랜스다임', tier: 2 },

  // 추가 핀테크/결제 (5)
  { ticker: 'AFRM', name: 'Affirm Holdings Inc.', nameKr: '어펌', tier: 2 },
  { ticker: 'FIS', name: 'Fidelity National Information', nameKr: 'FIS', tier: 2 },
  { ticker: 'FISV', name: 'Fiserv Inc.', nameKr: '파이서브', tier: 2 },
  { ticker: 'GPN', name: 'Global Payments Inc.', nameKr: '글로벌페이먼츠', tier: 2 },
  { ticker: 'NU', name: 'Nu Holdings Ltd.', nameKr: '누홀딩스', tier: 2 },

  // 추가 게임/메타버스 (5)
  { ticker: 'EA', name: 'Electronic Arts Inc.', nameKr: 'EA(일렉트로닉아츠)', tier: 2 },
  { ticker: 'TTWO', name: 'Take-Two Interactive Software', nameKr: '테이크투', tier: 2 },
  { ticker: 'U', name: 'Unity Software Inc.', nameKr: '유니티', tier: 2 },
  { ticker: 'SE', name: 'Sea Limited', nameKr: '씨리미티드', tier: 2 },
  { ticker: 'GRAB', name: 'Grab Holdings Limited', nameKr: '그랩', tier: 2 },

  // 추가 헬스케어/의료기기 (5)
  { ticker: 'SYK', name: 'Stryker Corporation', nameKr: '스트라이커', tier: 2 },
  { ticker: 'ZTS', name: 'Zoetis Inc.', nameKr: '조에티스', tier: 2 },
  { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', nameKr: '버텍스', tier: 2 },
  { ticker: 'GEHC', name: 'GE HealthCare Technologies', nameKr: 'GE헬스케어', tier: 2 },
  { ticker: 'EW', name: 'Edwards Lifesciences Corp.', nameKr: '에드워즈라이프사이언스', tier: 2 },

  // 추가 인프라/유틸리티 (2)
  { ticker: 'SO', name: 'The Southern Company', nameKr: '서던컴퍼니', tier: 2 },
  { ticker: 'DUK', name: 'Duke Energy Corporation', nameKr: '듀크에너지', tier: 2 },

  // 추가 소재/원자재 (4)
  { ticker: 'FCX', name: 'Freeport-McMoRan Inc.', nameKr: '프리포트맥모란', tier: 2 },
  { ticker: 'NEM', name: 'Newmont Corporation', nameKr: '뉴몬트', tier: 2 },
  { ticker: 'LIN', name: 'Linde plc', nameKr: '린데', tier: 2 },
  { ticker: 'APD', name: 'Air Products and Chemicals', nameKr: '에어프로덕츠', tier: 2 },

  // 추가 운송/물류 (4)
  { ticker: 'UPS', name: 'United Parcel Service Inc.', nameKr: 'UPS', tier: 2 },
  { ticker: 'FDX', name: 'FedEx Corporation', nameKr: '페덱스', tier: 2 },
  { ticker: 'DAL', name: 'Delta Air Lines Inc.', nameKr: '델타항공', tier: 2 },
  { ticker: 'UAL', name: 'United Airlines Holdings', nameKr: '유나이티드항공', tier: 2 },
];

// ─────────────────────────────────────────────
// Tier 3: DB 관리 종목 (동적 확장)
// ─────────────────────────────────────────────
export const TIER3_STOCKS: TieredStock[] = [];

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
