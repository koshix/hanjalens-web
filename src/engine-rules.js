// Hanja Lens conversion rule data.
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.HanjaLensEngineRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

// Single-syllable/ambiguous forms are not globally converted. Context makes them safe.
  const CONTEXT_RULES=[
    // v3.0: development corpus new-topics-v1. These rules resolve only
    // contexts where an existing surface has multiple Hanja readings.
    {re:/((?:권력|권한|권리)(?:이|가|을|를)?(?:\s+[^\s,.!?，。！？]+){0,3}\s+)행사(?=되)/gu,rep:'$1行使'},
    {re:/(권력|권한|권리)(을|를)\s+행사(?=하|했|합|할|해)/gu,rep:'$1$2 行使'},
    {re:/기능\s+보유자/gu,rep:'技能 保有者'},
    {re:/생활과\s+사고(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'生活과 思考'},
    {re:/연구비\s+지원(?=을|를|이|가|은|는|에|\s|$|[,.!?，。！？])/gu,rep:'研究費 支援'},
    {re:/세대\s+간(?=\s|$|[,.!?，。！？])/gu,rep:'世代 間'},
    {re:/(논문|구독자)\s+수(?=와|가|는|를|의|\s|$|[,.!?，。！？])/gu,rep:'$1 数'},
    {re:/임용\s+시(?=\s|$|[,.!?，。！？])/gu,rep:'任用 時'},
    {re:/직장\s+내(?=\s|$|[,.!?，。！？])/gu,rep:'職場 内'},
    {re:/제(\d+)장(?=에|은|는|이|가|을|를|의|\s|$|[,.!?，。！？])/gu,rep:'第$1章'},
    {re:/수업의\s+질(?=에|은|는|이|가|을|를|의|\s|$|[,.!?，。！？])/gu,rep:'授業의 質'},
    {re:/요청(?=받)/gu,rep:'要請'},
    // Fresh corpus v2 batch 21: narrow context-only recovery.
    // Bare ambiguous surfaces remain unresolved.
    {re:/출장비/gu,rep:'出張費'},
    {re:/출장(?=\s+신청서)/gu,rep:'出張'},
    {re:/입사(?=\s+첫날)/gu,rep:'入社'},
    {re:/풍속(?=에\s+따라)/gu,rep:'風速'},
    {re:/(과목의\s+)정원(?=이|가|은|는|을|를|의|\s|$|[,.!?，。！？])/gu,rep:'$1定員'},
    {re:/도서(?=\s+대출)/gu,rep:'図書'},
    {re:/무인(?=\s+단말기)/gu,rep:'無人'},
    {re:/사전(?=\s+예약)/gu,rep:'事前'},
    {re:/강도(?=를\s+조절)/gu,rep:'強度'},
    {re:/방문(?=\s+(?:시간|날짜))/gu,rep:'訪問'},
    {re:/보도(?=\s+전)/gu,rep:'報道'},
    {re:/생활\s+불편\s+신고(?=는|가|를|\s|$|[,.!?，。！？])/gu,rep:'生活 不便 申告'},
    {re:/(기사\s+제목[^,.!?，。！？]{0,20}\s)수정(?=하|했|합|할|해)/gu,rep:'$1修正'},
    {re:/성적(?=\s+조회)/gu,rep:'成績'},
    {re:/(표절\s+)사례(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1事例'},
    {re:/((?:혈압|혈당|콜레스테롤|체온|측정)\s+)수치(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1数値'},
    {re:/(예정\s+)시각(?=은|이|가|을|를|의|\s|$|[,.!?，。！？])/gu,rep:'$1時刻'},
    {re:/일시(?=\s+중단)/gu,rep:'一時'},
    {re:/차선(?=의\s+통행)/gu,rep:'車線'},
    {re:/온라인\s+주문(?=\s+환불)/gu,rep:'オンライン 注文'},
    {re:/((?:인력)(?:을|를)?[^,.!?，。！？]{0,28}\s)배치(?=하|했|합|할|해)/gu,rep:'$1配置'},
    {re:/(축제\s+)지도(?=와|과|를|가|는|의|에서|\s|$|[,.!?，。！？])/gu,rep:'$1地図'},

    // Fresh corpus v2 batch 22: narrow residual recovery.
    {re:/연차(?=\s+사용)/gu,rep:'年次：年次休暇'},
    {re:/(앱에서도\s+)조회(?=할|하|했|합|해)/gu,rep:'$1照会'},
    {re:/표(?=와\s+그래프)/gu,rep:'表'},
    {re:/(고객\s+)문의(?=가|를|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1問議：問い合わせ'},
    // v3.5 unseen residual: narrow context-only recoveries.
    {re:/혈액검사수치(?=와|과|를|가|는|은|의|\s|$|[,.!?，。！？])/gu,rep:'血液検査数値'},
    {re:/(오류처리방식을\s+)수정(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1修正'},
    {re:/(파일보관기간을\s+)조정(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1調整'},
    {re:/보고(?=하|한|했|합|할|해|해야|되|된|됐|됩|될)/gu,rep:'報告'},
    {re:/정상화(?=하|한|했|합|할|해|되|된|됐다|됐|됩|될)/gu,rep:'正常化'},
    {re:/재정비(?=하|한|했|합|할|해)/gu,rep:'再整備'},

    // Fresh corpus v2 batch 20: 승인 is 承認 / 勝因; only verbal uses select 承認.
    {re:/승인(?=하|했|합|할|해|되|됐|된|될|됩|받)/gu,rep:'承認'},
    {re:/(관리자\s+)승인(?=\s+후)/gu,rep:'$1承認'},
    // v3.3 unseen corpus 1 batch 12: narrow residual recoveries.
    {re:/(환자명과\s+)용량(?=을|를|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1用量'},
    {re:/(학술대회[^,.!?，。！？]{0,24}\s)초록(?=\s+수정본)/gu,rep:'$1抄録'},
    {re:/(자료\s+)조작(?=과|와|을|를|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1改ざん'},
    {re:/(중복게재\s+)사례(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1事例'},
    {re:/(공연\s+)예매(?=\s+취소)/gu,rep:'$1予約'},
    {re:/(프로젝트\s+)저장소(?=의|를|가|는|은|에|에서|\s|$|[,.!?，。！？])/gu,rep:'$1リポジトリ'},
    {re:/(지역축제\s+운영위원회는\s+)행사장(?=\s+안전계획)/gu,rep:'$1会場'},
    {re:/(출입이\s+)통제(?=되|될|됩|된|됐|되는|되면)/gu,rep:'$1規制'},
    // v3.3 unseen corpus 1 batch 13: narrow residual recoveries.
    {re:/(예금[^,.!?，。！？]{0,32}\s+)해지(?=하|한|했|합|할|해)/gu,rep:'$1解約'},
    {re:/(자동납부를\s+)해지(?=하|한|했|합|할|해)/gu,rep:'$1解約'},
    {re:/(게시판에\s+)공지(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1告知'},
    {re:/(수도계량기\s+)수치(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1数値'},
    {re:/(혈압과\s+혈당\s+)수치(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1数値'},
    {re:/(전기요금\s+)절감(?=을|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1削減'},
    {re:/(비밀번호는\s+)보안상(?=\s)/gu,rep:'$1セキュリティ上'},
    {re:/사내(?=\s+메신저)/gu,rep:'社内'},
    {re:/(입사자는\s+)계정(?=\s+발급)/gu,rep:'$1アカウント'},
    {re:/(접수창구에\s+)문의(?=하|해|했|합|할|해야|되)/gu,rep:'$1問い合わせ'},
    {re:/(백업본은[^,.!?，。！？]{0,32}\s+)저장(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1保存'},
    // v3.6: 保存 only when 저장 takes an information/document-like object.
    // Keep broad 저장하다 unresolved because storage/stockpiling senses remain possible.
    {re:/((?:결과|結果|기록|記録|자료|資料|정보|情報|파일|ファイル|내역|内訳|연락처|連絡処)(?:을|를)[^,.!?，。！？]{0,40}\s)저장(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1保存'},
    {re:/(환경설정\s+파일의\s+)값(?=이|가|은|는|을|를|의|\s|$|[,.!?，。！？])/gu,rep:'$1値'},
    {re:/(병실\s+)배정(?=\s+안내)/gu,rep:'$1割当'},
    {re:/(재활치료\s+계획은[^,.!?，。！？]{0,32}\s+)조정(?=하|해|했|합|할|되|된|됐|됩|될)/gu,rep:'$1調整'},
    {re:/검사(?=\s+예약\s+변경)/gu,rep:'検査'},
    {re:/(안전계획을\s+)사전(?=에\s+점검)/gu,rep:'$1事前'},
    {re:/인정(?=받)/gu,rep:'認定'},
    {re:/매체(?=일수록)/gu,rep:'媒体'},
    {re:/(공식|정부|회사|당국)\s+입장(?=을|를|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1 立場'},
    // High-confidence disambiguation rules discovered in real-text regression testing.
    // Keep the bare surfaces protected; only these constrained contexts may convert them.
    {re:/(관련|주요|유력|정계|정부|여권|야권|정치권)\s+인사(?=들|의|가|는|를|와|과|에게|\s|$|[,.!?，。！？])/gu,rep:'$1 人士'},
    {re:/공포(?=하|한|했|합)/gu,rep:'公布'},
    {re:/로\s+인해(?=\s|$|[,.!?，。！？])/gu,rep:'로 因해'},
    {re:/연구가(?=\s+진행)/gu,rep:'研究가'},
    {re:/수요가(?=(?:\s+[^\s,.!?，。！？]+){0,3}\s+증가)/gu,rep:'需要가'},
    {re:/이상(?=하|한|했|합)/gu,rep:'異常'},
    {re:/로\s+부상(?=하|한|했|합|되|된|됨)/gu,rep:'로 浮上'},
    {re:/대체\s+식품/gu,rep:'代替 食品'},
    {re:/수입\s+농산물/gu,rep:'輸入 農産物'},
    {re:/(^|\s)(그|이|저) 점(?=에|은|는|이|가|을|를|도|만|\s|$|[,.!?，。！？])/gu,rep:'$1$2 点'},
    {re:/(\d+)시(?=\s|$|[,.!?，。！？]|로|에|부터|까지)/gu,rep:'$1時'},
    {re:/몇 시(?=\s|$|[,.!?，。！？]|로|에|부터|까지)/gu,rep:'몇 時'},
    {re:/(\d+)년/gu,rep:'$1年'},
    {re:/(\d+年)\s+후(?=\s|$|[,.!?，。！？]|의|에|부터|까지)/gu,rep:'$1 後'},
    {re:/(\d+)월/gu,rep:'$1月'},
    {re:/(\d+)일/gu,rep:'$1日'},
    {re:/(\d+)분/gu,rep:'$1分'},
    // v4.2: number magnitudes and counters directly after Arabic digits (product decision 2026-10-08:
    // 174명 → 174名, 3억 원 → 3億 ウォン, 1만건 → 1万件). Magnitudes first, then 余, then counters.
    {re:/제(\d+)(조|항|호)(?=\s|$|[^가-힣]|의|에|를|을|은|는|이|가|와|과|및|부터|까지|에서)/gu,rep:(m,d,u)=>'第'+d+({'조':'条','항':'項','호':'号'})[u]},
    {re:/(?<=\d(?:[천만억조])*)(천|만|억)(?=[\d\s,]|천|만|억|조|원|명|건|여|개|달러|위안|엔|유로|가구|톤|$|[^가-힣]|을|를|이|가|은|는|의|에|으로|로|도|씩|에서|대)/gu,rep:u=>({'천':'千','만':'万','억':'億'})[u]},
    {re:/(?<=\d(?:[천만억])*)조(?=\s?\d|\s?원|\s?달러|\s?위안|\s?엔|\s?유로|여|\s?규모|\s?대)/gu,rep:'兆'},
    {re:/([千万億兆])여(?=[\s,]|원|명|건|개|마리|가구|곳|대|$|[^가-힣]|을|를|이|가|의|에)/gu,rep:'$1余'},
    {re:/([\d千万億兆余])(\s?)원대(?=\s|$|[^가-힣]|을|를|이|가|은|는|의|에|으로|로|과|와|도|만|까지|부터|씩|짜리|가량|정도|에서|보다|당|꼴|선|밖에|대|어치|안팎|뿐|중|미만|초과|가운데)/gu,rep:'$1$2ウォン台'},
    {re:/([\d千万億兆余])(\s?)원(?=\s|$|[^가-힣]|을|를|이|가|은|는|의|에|으로|로|과|와|도|만|까지|부터|씩|짜리|가량|정도|에서|보다|당|꼴|선|밖에|대|어치|안팎|뿐|중|미만|초과|가운데)/gu,rep:'$1$2ウォン'},
    {re:/([\d千万億兆余])(\s?)명(?=\s|$|[^가-힣]|을|를|이|가|은|는|의|에|으로|로|과|와|도|만|까지|부터|씩|짜리|가량|정도|에서|보다|당|꼴|선|밖에|대|어치|안팎|뿐|중|미만|초과|가운데)/gu,rep:'$1$2名'},
    {re:/([\d千万億兆余])(\s?)건(?=\s|$|[^가-힣]|을|를|이|가|은|는|의|에|으로|로|과|와|도|만|까지|부터|씩|짜리|가량|정도|에서|보다|당|꼴|선|밖에|대|어치|안팎|뿐|중|미만|초과|가운데)/gu,rep:'$1$2件'},
    // v4.2 (second attempt): digit + 도 is 度 only in unambiguous temperature / angle contexts. A bare
    // "2030도" (people in their 20s–30s + 도 "also") stays Hangul. Contexts: a decimal number (10.6도); a range
    // (8∼16도, 18도에서 24도); a temperature word shortly before (기온, 최저, 최고, 섭씨, 영하 …); an angle verb after
    // (180도 달라지다, 90도로 꺾다).
    {re:/(\d\.\d+)도(?=\s|$|[,.!?，。！？)~∼]|로|를|까지|에서|이|가|의|씩|안팎|가량|나|에|는|도|대|정도|내외|이상|이하|차)/gu,rep:'$1度'},
    {re:/(\d)도(\s*[~∼\-]\s*\d+(?:\.\d+)?)도(?=\s|$|[,.!?，。！？)~∼]|로|를|까지|에서|이|가|의|씩|안팎|가량|나|에|는|도|대|정도|내외|이상|이하|차)/gu,rep:'$1度$2度'},
    {re:/(\d)도(?=\s*[~∼\-]\s*\d)/gu,rep:'$1度'},
    {re:/(\d)(\s*[~∼\-]\s*\d+)도(?=\s|$|[,.!?，。！？)~∼]|로|를|까지|에서|이|가|의|씩|안팎|가량|나|에|는|도|대|정도|내외|이상|이하|차)/gu,rep:'$1$2度'},
    {re:/(\d)도(에서\s*\d+(?:\.\d+)?)도(?=\s|$|[,.!?，。！？)~∼]|로|를|까지|에서|이|가|의|씩|안팎|가량|나|에|는|도|대|정도|내외|이상|이하|차)/gu,rep:'$1度$2度'},
    {re:/(?<=(?:기온|기온은|기온이|최저|최고|섭씨|화씨|영하|영상|수온|온도|체온|일교차|평년|체감)[^.。!?\n]{0,24})(\d)도(?=\s|$|[,.!?，。！？)~∼]|로|를|까지|에서|이|가|의|씩|안팎|가량|나|에|는|도|대|정도|내외|이상|이하|차)/gu,rep:'$1度'},
    {re:/(\d)도(?=\s*(?:로\s*)?(?:달라|돌아|돌려|회전|꺾|기울|바뀌|틀어|전환))/gu,rep:'$1度'},
    {re:/(다음|이번|지난) 주(?=\s|$|[,.!?，。！？])/gu,rep:'$1 週'},

    // v4.2: reviewed homograph rules (bare forms are protected; only these contexts select a reading).
    // 대비: 対比 (comparison) after a reference period / baseline; 대비하다 (対備, prepare) stays held as reviewed.
    {re:/(전년|전월|전주|전분기|전기|전년도|지난해|작년|평년|예년|동기|직전|평균|예상치?|목표)(\s*)(동기\s*)?대비(?=\s|$|[,.!?，。！？)]|로|해|하여)/gu,rep:'$1$2$3対比'},
    // 세수: 税収 with fiscal context words.
    {re:/(?<![가-힣])세수(?=\s*(?:결손|부족|증가|감소|확보|추계|여건|실적|호조|펑크|오차|전망|감소분|증가분|진도율))/gu,rep:'税収'},
    {re:/(국세|법인세|소득세|부가세|양도세|세금)(\s*)세수/gu,rep:'$1$2税収'},
    // 세제: 税制 with policy context words.
    {re:/(?<![가-힣])세제(?=\s*(?:개편|혜택|감면|개혁|정책|지원|변화|개정|개편안|개편안은))/gu,rep:'税制'},
    // 방문: 訪問 as a verb or with visitor nouns (방문을 닫다 = 房門 stays held).
    {re:/방문(?=하|해|한|했|할|합|길|\s+(?:조사|판매|진료|기간|일정|목적))/gu,rep:'訪問'},
    // 원고: 原告 in litigation context (원고 = 原稿 manuscript remains the core reading).
    {re:/(?<![가-힣])원고(?=\s*(?:측|승소|패소|일부\s*승소|청구|대리인|들은|들이))/gu,rep:'原告'},
    {re:/원고(와|과)(\s*)피고/gu,rep:'原告$1$2被告'},
    // 발효: 発効 for laws, treaties and weather warnings taking effect (발효 = 発酵 remains the core reading).
    {re:/(법|협정|조약|협약|특보|주의보|경보|제재|규정|조치|효력|개정안|시행령|관세)(이|가|은|는)?(\s*)발효(?=되|됐|된|돼|한다|했|하|일|\s|$|[,.!?，。！？])/gu,rep:'$1$2$3発効'},
    // 전수: 全数 before 조사/검사.
    {re:/전수(\s+)(조사|검사|점검)(?=\s|$|[,.!?，。！？)]|을|를|이|가|은|는|에|의|도|로|와|과|에서)/gu,rep:(m,sp,w)=>'全数'+sp+({'조사':'調査','검사':'検査','점검':'点検'})[w]},

    // v2.6: reviewed ambiguity rules. Bare forms remain protected; only narrow
    // lexical/syntactic contexts are allowed to select a Hanja reading.
    // 지원: 支援 (support) vs 志願 (application/volunteering).
    {re:/(기술|재정|의료|긴급|생활|취업|창업|주거|교육|연구|복지|정부)\s+지원(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|으로)/gu,rep:'$1 支援'},
    {re:/지원\s+(사업|정책|예산|제도|센터|서비스|프로그램|대책|기금|요청|대상|대상자)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'支援 $1'},
    {re:/(대학|대학원|회사|채용|공모|시험|장학금|프로그램)에\s+지원(?=하|했|합|할|해|자|한|하면)/gu,rep:'$1에 志願'},

    // 시행: 施行 (enact/implement) vs 試行 (trial), chiefly in 試行錯誤.
    {re:/(법|법률|규정|제도|정책|조치|계획|사업|명령|지침)\s+시행(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|하|되)/gu,rep:'$1 施行'},
    {re:/시행\s+(규칙|세칙|일자|일정|시기|계획|결과)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'施行 $1'},
    {re:/시행착오/gu,rep:'試行錯誤'},
    {re:/(법|법률|규정|제도|정책|조치|계획|사업|명령|지침)(이|가|은|는)\s+시행(?=하|되|됐|됩|된|될)/gu,rep:'$1$2 施行'},
    {re:/시행(?=될\s+(예정|계획))/gu,rep:'施行'},
    {re:/날로부터\s+시행(?=하|한|되)/gu,rep:'날로부터 施行'},
    {re:/(확대|전면|본격|즉시)\s+시행(?=하|되|했|됩|된|할)/gu,rep:'$1 施行'},

    // 감사: 感謝 (gratitude) vs 監査 (audit).
    // Bare 감사 remains protected; only reviewed contexts may convert.
    {re:/(회계|내부|외부|정기|특별|기관)\s+감사(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|에서|의|로)/gu,rep:'$1 監査'},
    {re:/감사\s+(결과|보고서|대상|자료|계획|절차|기준|내용)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|에서|의|로)/gu,rep:'監査 $1'},

    // 주문: 注文 (commercial order) vs 呪文 (incantation).
    // Bare 주문 remains protected; only narrow reviewed contexts convert.
    {re:/(음식|커피|상품|제품|부품|물품|메뉴|디저트|책|티켓|표)(을|를)\s+주문(?=하|했|합|할|해|한|하면|하려)/gu,rep:'$1$2 注文'},
    {re:/주문\s+(수량|내역|번호|상품|제품|상태|취소|접수|확인|처리|결제|배송)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|로)/gu,rep:'注文 $1'},
    {re:/주문내역(?=에서|을|를|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'注文内訳'},
    {re:/주문(?=하신\s+(음식|상품|제품|메뉴))/gu,rep:'注文'},
    {re:/(마법|주술|마술)의\s+주문(?=을|를|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1의 呪文'},
    {re:/주문(을|를)\s+(외우|암송)(?=다|고|며|면|는|었다|었다가|겠|기|려고|$|[,.!?，。！？])/gu,rep:'呪文$1 $2'},

    // 조사: 調査 (survey/investigation) vs 助詞 (grammatical particle).
    {re:/(실태|설문|시장|여론|현장|통계|사고|원인|역학|환경|인구|만족도)\s+조사(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|하)/gu,rep:'$1 調査'},
    {re:/조사\s+(결과|대상|방법|기간|보고서|자료|항목|팀)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'調査 $1'},
    {re:/(주격|목적격|보격|관형격|부사격|호격|문법)\s+조사(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 助詞'},
    {re:/(반응|원인|사건|실태|현황|문제|사실|경위)(을|를)\s+조사(?=하|했|합|할|해|한|하면)/gu,rep:'$1$2 調査'},

    // 기상: 気象 (weather) vs 起床 (getting up).
    {re:/기상청/gu,rep:'気象庁'},
    {re:/기상\s+(정보|예보|관측|자료|위성|조건|현상|특보|레이더|악화)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|와|과|의|로)/gu,rep:'気象 $1'},
    {re:/(아침|새벽|평일|주말)\s+기상(?=\s|$|[,.!?，。！？]|시간|후|은|는|이|가)/gu,rep:'$1 起床'},
    {re:/기상\s+시간(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'起床 時間'},
    {re:/기상(?=하|했|합|할|해|하면|한 뒤)/gu,rep:'起床'},

    // 기사: 記事 / 技士 / 騎士 / 棋士.
    {re:/(뉴스|신문|보도|온라인|인터넷|관련|경제|사회|정치|문화)\s+기사(?=\s|$|[,.!?，。！？]|를|가|는|의|에서)/gu,rep:'$1 記事'},
    {re:/기사\s+(제목|내용|본문|작성|검색|링크)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'記事 $1'},
    {re:/(택시|버스|운전)\s+기사(?=\s|$|[,.!?，。！？]|가|는|를|에게|와|의)/gu,rep:'$1 技士'},
    {re:/(중세|갑옷을 입은)\s+기사(?=\s|$|[,.!?，。！？]|가|는|를|의)/gu,rep:'$1 騎士'},
    {re:/(바둑|프로 바둑)\s+기사(?=\s|$|[,.!?，。！？]|가|는|를|의)/gu,rep:'$1 棋士'},

    // 전: 前 in temporal 'before' phrases, 全 in a small set of distributive phrases.
    {re:/(회의|수술|출발|식사|시험|사용|입장|신청|결정|발표|취침|운동|투여|공연)\s+전(?=\s|$|[,.!?，。！？]|에|부터|까지|의)/gu,rep:'$1 前'},
    {re:/전\s+(세계|국민|직원|지역|과정|세대)(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의)/gu,rep:'全 $1'},

    // 이동: 移動 only in reviewed movement contexts.
    {re:/(인구|인사|부서)\s+이동(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 移動'},
    {re:/이동(?=하|했|합|할|해|한|하면|하려|될|되|됩|된)/gu,rep:'移動'},

    // 공동: 共同 only in reviewed collaborative contexts; bare 공동 may mean 空洞.
    {re:/공동(?=으로)/gu,rep:'共同'},
    {re:/공동\s+(연구팀|연구|사업|성명|대응|조사|개발|운영|관리)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|과|와)/gu,rep:'共同 $1'},

    // 장기: 長期 only in reviewed temporal planning/investment contexts.
    {re:/장기\s+(계획|전략|성장|투자)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|과|와)/gu,rep:'長期 $1'},

    // 후: 後 in reviewed temporal-after constructions.
    {re:/(회의|수술|식사|졸업|퇴근|도착|사용|검사|치료|운동|발표|취침|시행|施行|업데이트|접종|공연|편성|수업|투자|投資)\s+후(?=\s|$|[,.!?，。！？]|에|부터|까지|의)/gu,rep:'$1 後'},


    // v3.2 Fresh corpus v2 batch 2.
    // 접수: 接受 (receipt/acceptance) vs 接收 (seizure/takeover).
    // Bare form remains protected; only administrative receipt contexts convert.
    {re:/(모바일|온라인|창구|우편)로\s+접수(?=하|할|했|합|해|되|될|됐|됩)/gu,rep:'$1로 接受：受付'},
    {re:/접수\s+(창구|기간|방법|번호|증|완료|상태)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|에서|의|로)/gu,rep:'接受：受付 $1'},
    {re:/(신청서|지원서|신고서|신청|신고|민원|서류)(을|를)\s+접수(?=하|할|했|합|해|되|될|됐|됩)/gu,rep:'$1$2 接受：受付'},

    // v3.2 Fresh corpus v2 batch 1.
    // Bare forms stay protected; only reviewed contexts select a reading.
    // 전자: 電子 vs 前者.
    {re:/전자(?=(?:문서|체온계))/gu,rep:'電子'},
    {re:/전자\s+(방식|문서|기기|제품|기록|장치|정보|결재|체온계)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|로|으로)/gu,rep:'電子 $1'},
    {re:/전자(?=(?:와|보다)\s+후자)/gu,rep:'前者'},
    {re:/전자(?=의\s+(방식|사례|설명|의견|방안))/gu,rep:'前者'},

    // 조회: 照会 vs 朝会.
    {re:/(성적|成績|신분|신원|잔액|배송|기록|내역|정보)\s+조회(?=\s|$|[,.!?，。！？]|를|가|는|의|에|하|되)/gu,rep:'$1 照会'},
    {re:/(기록|내역|정보)([^,.!?，。！？]{0,40}\s)조회(?=하|할|했|합|해|되|될|됩)/gu,rep:'$1$2照会'},
    {re:/(학교|직장|아침)\s+조회(?=\s|$|[,.!?，。！？]|를|가|는|의|에)/gu,rep:'$1 朝会'},
    {re:/(온라인으로\s+)조회(?=하|할|했|합|해|되|될|됩)/gu,rep:'$1照会'},
    {re:/조회(?=에\s+(?:참석|나가|모이))/gu,rep:'朝会'},

    // v3.2 Fresh2: narrowly reviewed context additions.
    // Keep ambiguous/bare forms unconverted outside these contexts.

    // 기사: article when a newspaper-company sentence later refers to its article.
    {re:/(신문사(?:는|가)?[^,.!?，。！？]{0,48}\s)기사(?=에|의|\s|$|[,.!?，。！？])/gu,rep:'$1記事'},

    // 사실: factual sense in the reviewed fact-vs-opinion construction.
    {re:/사실과\s+의견/gu,rep:'事実과 의견'},

    // 안정: 安静 only in the fixed rest-taking construction.
    {re:/안정(을|을\s+)취(?=하|했|합|할|해|하는|하면|한|하다|하는)/gu,rep:(m)=>m.replace('안정','安静')},

    // 일정: 日程 (schedule) vs 一定 (constant/fixed).
    {re:/(행사|회의)\s+일정(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의)/gu,rep:'$1 日程'},
    {re:/다음\s+일정(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|도|에|의)/gu,rep:'다음 日程'},
    {re:/일정(?=한|하게)/gu,rep:'一定'},
    {re:/일정\s+기간(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|동안|에|의)/gu,rep:'一定 期間'},

    // v3.2 Fresh corpus v2 batch 5.
    // Context-only expansion for 일정 / 분기 / 조정.

    // 일정: 日程 in reviewed schedule nouns; 一定 rules above remain unchanged.
    {re:/(교육|납기|납품|프로젝트)\s+일정(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의|변경)/gu,rep:'$1 日程'},
    {re:/(정기검사\s+)일정(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의)/gu,rep:'$1日程'},

    // 분기: business/accounting quarter only; branch/divergence senses stay Korean.
    {re:/분기\s+(매출액|매출|영업이익|실적|결산|보고서)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'分期：四半期 $1'},
    {re:/(이번|지난|다음)\s+분기(?=\s+(?:매출|영업이익|실적|결산|예산|목표)|$|[,.!?，。！？])/gu,rep:'$1 分期：四半期'},

    // 조정: 調整 for schedule/target adjustment; conflict mediation remains Korean.
    {re:/상향\s+조정(?=하|했|합|할|해|되|될|됩)/gu,rep:'上向 調整'},
    {re:/(시간|일정|날짜|목표)(을|를)([^,.!?，。！？]{0,16}\s)조정(?=하|했|합|할|해|되|될|됩)/gu,rep:'$1$2$3調整'},

    // 입장: 入場 only in the reviewed admission/waiting construction.
    {re:/입장(?=까지)/gu,rep:'入場'},

    // 정기: 定期 only before inspection/checkup.
    {re:/정기\s+점검(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|으로|의)/gu,rep:'定期 점검'},

    // 지도: 地図 only in the reviewed tourist-information phrase.
    {re:/관광\s+안내\s+지도(?=\s|$|[,.!?，。！？]|에서|를|가|는|의)/gu,rep:'관광 안내 地図'},

    // v3.2 Fresh2 context batch 2.
    // Additional ambiguous surfaces; bare forms remain Korean.

    // 거래: 去来 in reviewed commercial-document context.
    {re:/거래\s+명세서(?=\s|$|[,.!?，。！？]|는|가|를|의|에서)/gu,rep:'去来 明細書'},

    // 공사: 工事, not 公社.
    {re:/공사\s+(소음|현장|기간|구간|작업)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|로)/gu,rep:'工事 $1'},

    // 매장: 売場 in retail contexts; do not confuse with 埋葬.
    {re:/매장(?=에서는|에서)/gu,rep:'売場'},
    {re:/매장\s+(운영|영업|직원|상품|재고|결제)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'売場 $1'},

    // 수정: 修正 only in editing/revision contexts; not 受精.
    {re:/수정\s+(의견|사항|내용|안|본)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'修正 $1'},
    {re:/(계획|문서|자료|내용|초안|정책|규정|설정)([^,.!?，。！？]{0,40}\s)수정(?=하|했|합|할|해)/gu,rep:'$1$2修正'},

    // 사내: 社内 in explicit company-internal contexts; native 사내 remains untouched.
    {re:/사내\s+(행사|업무|교육|규정|문서|공지|시스템)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'社内 $1'},

    // 민원: 民願 only in public-administration contexts.
    {re:/(시청|구청|주민센터|행정기관)\s+민원(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|창구|서류)/gu,rep:'$1 民願'},
    {re:/민원\s+(서류|창구|업무|처리|접수|신청)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'民願 $1'},

    // 시청: 市庁 only in municipal-government contexts; viewing sense remains untouched.
    {re:/시청\s+(민원|民願|청사|직원|공무원|홈페이지|업무)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|창구)/gu,rep:'市庁 $1'},

    // 화상: 画像 in the reviewed video-conference compound.
    {re:/화상\s+회의(?=\s|$|[,.!?，。！？]|를|가|는|의|로|에서)/gu,rep:'画像 会議'},

    // 상대: 相対 in explicit counterpart-company contexts.
    {re:/상대\s+(회사|기업|업체|측)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'相対 $1'},

    // 신고: 申告 in administrative/reporting contexts.
    {re:/(전입|전출|분실|파손|사고|세관|출생|사망)\s+신고(?=\s|$|[,.!?，。！？]|를|가|는|의|를|을|하|되)/gu,rep:'$1 申告'},
    {re:/(생활\s+불편\s+사항)(을|를)([^,.!?，。！？]{0,30}\s)신고(?=하|했|합|할|해)/gu,rep:'$1$2$3申告'},

    // 재고: 在庫 in stock/inventory contexts; not 再考.
    {re:/재고(?=가\s+(부족|많|없|남))/gu,rep:'在庫'},
    {re:/재고\s+(관리|수량|상품|확인|부족)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'在庫 $1'},

    // 사원: 社員 in explicit employment context; not 寺院.
    {re:/신입\s+사원(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'新入 社員'},

    // v3.2 Fresh2 context batch 3.
    // Narrow technical/productivity contexts only.

    // 공유: 共有 in document/research-information contexts.
    {re:/(회의\s+자료|실험\s+진행\s+상황)([^,.!?，。！？]{0,30}\s)공유(?=하|했|합|할|해|되|될|됩)/gu,rep:'$1$2共有'},
    {re:/(자료|문서|정보|파일)(을|를)\s+공유(?=하|했|합|할|해)/gu,rep:'$1$2 共有'},

    // Fresh corpus v2 batch 16:
    // Recover reviewed verbal/derivational forms while keeping exact mappings.
    {re:/입력(?=하|한|했|합|할|해|하는|하면)/gu,rep:'入力'},
    {re:/완료(?=되|된|됐|됩|될|되는|되면|하|한|했|합|할|해)/gu,rep:'完了'},

    // Fresh corpus v2 batch 11:
    // Recover reviewed derivational/verbal forms of already-safe Batch 10 surfaces.
    {re:/명시(?=하|한|했|합|할|해)/gu,rep:'明示'},
    {re:/명확(?=히)/gu,rep:'明確'},
    {re:/불규칙(?=하|한|했|합|할|해)/gu,rep:'不規則'},

    // Fresh corpus v2 batch 9:
    // 분리수거 is low-ambiguity, but verbalized forms need an early context rule.
    {re:/분리수거(?=하|한|했|합|할|해)/gu,rep:'分離収去'},
    // v3.3 unseen batch 7: reviewed derivational forms of exact surfaces.
    {re:/암호화(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'暗号化'},
    {re:/삭제(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'削除'},
    // v3.3 unseen batch 8: reviewed verbal forms for exact surfaces.
    {re:/의결(?=하|한|했|합|할|해)/gu,rep:'議決'},
    {re:/열람(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'閲覧'},
    {re:/조제(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'調剤'},
    // v3.3 unseen corpus 2 batch 2 correction: reviewed 멸균 verbal forms.
    {re:/멸균(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'滅菌'},
    // v3.3 unseen corpus 2 batch 3 correction: reviewed 상정 verbal forms.
    {re:/상정(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'上程'},
    // v3.3 unseen corpus 2 batch 3 correction: reviewed 답변 verbal forms.
    {re:/답변(?=하|한|했|합|할|해|해야|되|된|됐|됩|될|되는|되면)/gu,rep:'回答'},
    // v3.3 unseen corpus 2 batch 3 correction: reviewed 송출 verbal forms.
    {re:/송출(?=하|한|했|합|할|해|되|된|됐|됩|될|되는|되면)/gu,rep:'送出'},
    // v3.3 unseen corpus 2 batch 3 correction: reviewed -별 derivatives.
    {re:/연령대(?=별)/gu,rep:'年齢層'},
    {re:/시간대(?=별)/gu,rep:'時間帯'},
    // v3.3 unseen corpus 2 batch 5: narrow context-sensitive recoveries.
    {re:/(매장은[^,.!?，。！？]{0,30}\s+판매가격을\s+)인하(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1引下げ'},
    {re:/(활력징후와\s+의식수준을\s+)우선(?=\s+평가)/gu,rep:'$1優先'},
    {re:/(수술기록에는[^,.!?，。！？]{0,35}\s+)상세(?=히\s+기재)/gu,rep:'$1詳細'},
    {re:/(보안취약점과\s+예외처리를\s+)집중(?=적으로\s+확인)/gu,rep:'$1集中'},
    {re:/(창고관리\s+시스템은[^,.!?，。！？]{0,45}\s+)실시간(?=으로\s+갱신)/gu,rep:'$1リアルタイム'},
    {re:/실시간(?=으로\s+전송)/gu,rep:'リアルタイム'},
    {re:/(균열폭과\s+부식상태를\s+)중점적(?=으로\s+조사)/gu,rep:'$1重点的'},
    // v3.3 unseen corpus 2 batch 6: narrow context-sensitive recoveries.
    {re:/역할(?=별)/gu,rep:'役割'},
    {re:/종류(?=별)/gu,rep:'種類'},
    {re:/권고(?=받)/gu,rep:'勧告'},
    {re:/(조직개편\s+)일정(?=에|을|이|가|은|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1日程'},
    {re:/(인사발령은[^,.!?，。！？]{0,30}\s+)시행(?=되|된|됐|됩|될|되는|되면)/gu,rep:'$1実施'},
    {re:/(정정보도\s+요청을\s+)접수(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1受付'},
    {re:/(처리공정을\s+)조정(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1調整'},
    {re:/구간(?=에서는)/gu,rep:'区間'},
    {re:/((?:중점적으로|重点的으로)\s+)조사(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1調査'},
    // v3.3 unseen corpus 2 batch 6 correction: keep broad 구성/폐기물 unresolved.
    {re:/(교육프로그램은[^,.!?，。！？]{0,28}\s+)구성(?=되|된|됐|됩|될|되는|되면)/gu,rep:'$1構成'},
    {re:/폐기물(?=\s+(?:종류|種類)별)/gu,rep:'廃棄物'},
    {re:/(운송계약에는\s+)파손(?=이나)/gu,rep:'$1破損'},
    {re:/(재판매\s+가능\s+여부를\s+)판정(?=하|한|했|합|할|해)/gu,rep:'$1判定'},
    {re:/(일부\s+)품목(?=의)/gu,rep:'$1品目'},
    {re:/(매장은\s+)행사기간(?=\s+동안)/gu,rep:'$1行事期間'},
    // v3.3 unseen corpus 2 batch 6 closeout: residual context-only recoveries.
    {re:/(주기를\s+)각각(?=\s+다르게)/gu,rep:'$1各々'},
    {re:/(최종\s+)마감(?=\s+전에)/gu,rep:'$1締切'},
    {re:/(행정처분에\s+)이의(?=가\s+있으면)/gu,rep:'$1異議'},
    {re:/(서버\s+)장애(?=가\s+발생하면)/gu,rep:'$1障害'},
    {re:/(별도\s+)저장소(?=에\s+보관)/gu,rep:'$1ストレージ'},
    // v3.3 unseen corpus 2 batch 3: narrow high-frequency/context-sensitive recoveries.
    {re:/(심판을\s+)청구(?=하|한|했|합|할|해)/gu,rep:'$1請求'},
    {re:/(정보공개\s+)청구(?=에|를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1請求'},
    {re:/(요금이\s+)청구(?=되|된|됐|됩|될|되는|되면)/gu,rep:'$1請求'},
    {re:/거래처(?=별)/gu,rep:'取引先'},
    {re:/매장(?=은|는|이|가|을|를)/gu,rep:'売場'},
    {re:/명시(?=되|된|됐|됩|될|되는|되면)/gu,rep:'明示'},
    {re:/(전자세금계산서에\s+)기재(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1記載'},
    {re:/(수술기록에는[^,.!?，。！？]{0,28}\s+)기재(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1記載'},
    {re:/(온라인강의[^,.!?，。！？]{0,30}\s+)집계(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1集計'},
    {re:/(매출액과\s+미수금을[^,.!?，。！？]{0,20}\s+)집계(?=하|한|했|합|할|해|되|된|됐|됩|될)/gu,rep:'$1集計'},
    {re:/(암호키는[^,.!?，。！？]{0,24}\s+)주기(?=에|를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1周期'},
    {re:/(전체백업과\s+증분백업의\s+)주기(?=를|가|는|의|\s|$|[,.!?，。！？])/gu,rep:'$1周期'},

    // Fresh corpus v2 batch 8: residual context-sensitive surfaces.
    // Keep the bare forms unresolved; convert only reviewed contexts.

    // 거래: 去来 in transaction contexts.
    {re:/거래(?=가\s+(?:완료|完了))/gu,rep:'去来'},

    // 검사: 検査 in explicit examination/test contexts.
    // v3.6: verbal morphology disambiguates 검사(検査) from 검사(検事).
    {re:/검사(?=하|한|했|합|할|해|하는|하면|하다|되고|되며|되면|되다)/gu,rep:'検査'},
    {re:/검사(?=\s+(날짜|자료|방법|절차))/gu,rep:'検査'},

    // 고장: 故障 only with equipment/device nouns.
    {re:/(냉각장치|장비|기기|설비|부품)\s+고장(?=\s|$|[,.!?，。！？]|으|이|가|은|는|에|으로|로)/gu,rep:'$1 故障'},

    // 기상: 気象 only in meteorological situation context.
    {re:/기상\s+상황(?=\s|$|[,.!?，。！？]|을|이|가|은|는|에|때문)/gu,rep:'気象 状況'},

    // 공사: 工事 in reviewed repair-work phrase.
    {re:/보수\s+공사(?=\s|$|[,.!?，。！？]|로|가|는|를|의|에)/gu,rep:'補修 工事'},

    // 공유: 共有 when an explicit information/content object is shared.
    {re:/(사항|내용|변경\s+사항)(을|를)([^,.!?，。！？]{0,30}\s)공유(?=하|했|합|할|해)/gu,rep:'$1$2$3共有'},

    // 공지: 公知 only in the reviewed LMS notification context.
    // Keep generic verbal 공지 unresolved.
    {re:/학습관리시스템에\s+공지(?=되)/gu,rep:'学習管理システム에 公知'},

    // 구간: 区間 in usage/travel span contexts.
    {re:/이용\s+구간(?=\s|$|[,.!?，。！？]|에|을|이|가|은|는|의|따라)/gu,rep:'利用 区間'},
    {re:/(일부\s+)구간(?=\s|$|[,.!?，。！？]|에|을|이|가|은|는|의|로)/gu,rep:'$1区間'},
    // v3.3 unseen corpus 1 batch 7: narrow residual recoveries.
    {re:/외래(?=\s+진료)/gu,rep:'外来'},
    {re:/하천\s+수위(?=가|를|는|의|\s|$|[,.!?，。！？])/gu,rep:'河川 水位'},
    {re:/(보안교육을\s+)이수(?=하|해|했|합|할|해야|되)/gu,rep:'$1履修'},

    // 기기: 機器 with explicit device-class modifiers.
    {re:/(디지털|전자|의료|통신)\s+기기(?=\s|$|[,.!?，。！？]|를|가|는|의|에)/gu,rep:'$1 機器'},

    // 독자: 読者 in reader-response context.
    {re:/독자\s+반응(?=\s|$|[,.!?，。！？]|을|이|가|은|는|의)/gu,rep:'読者 反応'},


    // 포장: 包装 in goods/food contexts, not 舗装.
    {re:/(상품|식품|제품|선물)\s+포장(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|방식)/gu,rep:'$1 包装'},

    // 동작: 動作 for machinery/device behavior.
    {re:/(장치|기계|로봇|시스템)([^,.!?，。！？]{0,24}\s)동작(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|하)/gu,rep:'$1$2動作'},
    {re:/동작(?=을\s+(반복|제어|확인|조절))/gu,rep:'動作'},

    // 조정: 調整 in settings/control contexts.
    {re:/(설정|제어값|출력|온도)(을|를)\s+조정(?=하|했|합|할|해)/gu,rep:'$1$2 調整'},

    // 진동: 振動 in device/engineering/phone-mode contexts.
    {re:/(장치|기계|모터)의\s+진동(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1의 振動'},
    {re:/(휴대전화|携帯電話)(를|을)\s+진동(?=으로)/gu,rep:'$1$2 振動'},

    // 녹화: 録画 in class/video contexts, not 緑化.
    {re:/(수업|강의|방송|회의)\s+녹화(?=\s|$|[,.!?，。！？]|를|가|는|의|영상)/gu,rep:'$1 録画'},

    // v2.8: third reviewed ambiguity set.
    // 공포: 公布 (promulgation) vs 恐怖 (fear).
    {re:/공포\s+(영화|소설|장면|분위기)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'恐怖 $1'},
    {re:/공포(?=감|에\s+떨|를\s+(느끼|주|일으키|조성))/gu,rep:'恐怖'},

    // 인사: 人事 in personnel/HR contexts; 人士 is handled by earlier rules.
    {re:/인사\s+(담당자|발령|정책|담당|평가|이동|移動|관리|제도|부서)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|와|과)/gu,rep:'人事 $1'},

    // 이상: 以上 (threshold), 異常 (abnormality), 理想 (ideal).
    {re:/([\d千万億兆余]+(?:세|명|도|개|회|시간|분|년|개월|원|%|名|度|分|年|件|\s?ウォン))(\s*)이상(?=\s|$|[,.!?，。！？]|만|이|가|은|는|을|를|으로|의)/gu,rep:'$1$2以上'},
    {re:/이상\s+(신호|반응|기후|징후|현상|상태|소음|수치)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'異常 $1'},
    {re:/(높은|숭고한|정치적|사회적)\s+이상(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 理想'},
    {re:/이상(?=을\s+(추구|실현|품))/gu,rep:'理想'},

    // 부상: 負傷 (injury); 浮上 is handled by the earlier '로 부상-' rule.
    {re:/부상\s+(선수|부위|정도|상태)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'負傷 $1'},
    {re:/부상(?=을\s+입|으로\s+[^,.!?，。！？]{0,24}(?:결장|빠지|이탈)|자(?:가|는|를|의|\s|$))/gu,rep:'負傷'},

    // 대체: 代替 in replacement/substitution noun contexts; adverbial '대체 왜/누구' stays protected.
    {re:/대체\s+(에너지|재료|부품|결제\s+수단|수단|기술|식품|서비스|연료|방법|제품)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'代替 $1'},

    // 수입: 輸入 (import) vs 収入 (income).
    {re:/수입\s+(농산물|자동차|상품|식품|의약품|원자재|품목)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'輸入 $1'},
    {re:/(원유|원자재|상품|식품|의약품)(을|를)([^,.!?，。！？]{0,30})수입(?=하|한|한다|하는|해서|하면|했|합|할|해)/gu,rep:'$1$2$3輸入'},
    {re:/((?:품목|品目)|상품|원자재|식품|의약품)의\s+수입(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1의 輸入'},
    {re:/(월|연간|평균|가구|개인|주요)\s+수입(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의)/gu,rep:'$1 収入'},
    {re:/수입(?=원(?:이|은|을|의|\s|$)|과\s+지출)/gu,rep:'収入'},

    // 연구가: 研究 + subject particle 가 vs lexical 研究家.
    {re:/연구가(?=\s+(진행|빠르게|필요|곧|성공적|증가|늘|시작|끝))/gu,rep:'研究가'},
    {re:/(저명한|유명한|독립|민간)\s+연구가(?=가|는|를|의|로|에게|\s|$|[,.!?，。！？])/gu,rep:'$1 研究家'},
    {re:/(그|이|저)\s+연구가(?=는|가|를|의|에게|\s|$|[,.!?，。！？])/gu,rep:'$1 研究家'},

    // 수요가: 需要 + subject particle 가 vs technical noun 需要家.
    {re:/(전력|주택|반도체|관광|제품|에너지|시장|소비)\s+수요가(?=\s|$|[,.!?，。！？])/gu,rep:'$1 需要가'},
    {re:/(대규모\s+전력|산업용\s+가스|전력|가스)\s+수요가(?=를|에게|의|는|가)/gu,rep:'$1 需要家'},

    // 공정: 工程 (process) vs 公正 (fairness).
    {re:/(생산|제조|반도체|가공|조립)\s+공정(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 工程'},
    {re:/공정\s+(기술|관리|시스템|단계|품질)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'工程 $1'},
    {re:/공정(?=을\s+(자동화|개선|관리|최적화|단축)(?:하|했|합|할|해|되|됐|됩|될))/gu,rep:'工程'},
    {re:/공정(?=한|하게|하지|성)/gu,rep:'公正'},

    // 의식: 意識 (awareness/consciousness) vs 儀式 (ceremony/rite).
    {re:/(안전|환경\s+보호|시민|권리|문제|책임)\s+의식(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 意識'},
    {re:/의식(?=을\s+(회복|잃|되찾)|하고\s+있|하(?:고|며|면|는|다))/gu,rep:'意識'},
    {re:/(졸업|전통|종교|공식|추모|결혼)\s+의식(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'$1 儀式'},

    // v2.7: second reviewed ambiguity set.
    // 사고: 事故 (accident) vs 思考 (thinking).
    {re:/(교통|안전|산업|의료|추락|화재|충돌|열차|항공|선박)\s+사고(?=\s|$|[,.!?，。！？]|가|는|를|의|로|에)/gu,rep:'$1 事故'},
    {re:/사고\s+(원인|현장|예방|조사|처리|발생|위험)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'事故 $1'},
    {re:/(비판적|논리적|창의적|과학적|수학적)\s+사고(?=\s|$|[,.!?，。！？]|가|는|를|의|력|방식|과정)/gu,rep:'$1 思考'},
    {re:/사고\s+(방식|과정|능력|실험)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'思考 $1'},

    // 구호: 救護 (relief) vs 口号 (slogan).
    {re:/(긴급|재난|인도적|의료|국제)\s+구호(?=\s|$|[,.!?，。！？]|가|는|를|의|물품|활동|단체)/gu,rep:'$1 救護'},
    {re:/구호\s+(물품|활동|단체|요청|현장)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'救護 $1'},
    {re:/(선거|정치|시위|캠페인|응원)\s+구호(?=\s|$|[,.!?，。！？]|가|는|를|의)/gu,rep:'$1 口号'},
    {re:/구호를\s+(외치|적|만들)/gu,rep:'口号를 $1'},

    // 인지: 認知 in cognitive/recognition contexts; grammatical -인지 stays protected.
    {re:/(인지\s+(능력|기능|과학|심리학|부하|치료|검사|장애))(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:(m)=>m.replace('인지','認知')},
    {re:/검사\s+(결과|자료|방법|절차)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의|과|와)/gu,rep:'検査 $1'},
    {re:/의료진(?:은|이|가)?\s+검사(?=\s+(?:전|후)|를|가|는|의|에서|실|\s|$|[,.!?，。！？])/gu,rep:(m)=>m.replace('검사','検査')},
    {re:/병원\s+검사실(?=\s|$|[,.!?，。！？]|앞|에서|의)/gu,rep:'병원 検査室'},
    {re:/(위험|문제|상황|얼굴|음성|패턴)(을|를)\s+인지(?=하|했|합|할|해|한)/gu,rep:'$1$2 認知'},
    {re:/인지세(?=\s|$|[,.!?，。！？]|를|가|는|의)/gu,rep:'印紙税'},

    // 장내: 腸内 (intestinal) vs 場内 (inside a venue).
    {re:/장내\s+(세균|미생물|환경|균총|플로라)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'腸内 $1'},
    {re:/장내\s+(방송|안내|정리|질서|관객|시설)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|의)/gu,rep:'場内 $1'},

    // 수급: 需給 (supply-demand) vs 受給 (receipt of benefits).
    {re:/(전력|인력|원자재|주택|에너지|식량|반도체)\s+수급(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에|의|안정)/gu,rep:'$1 需給'},
    {re:/수급\s+(불균형|안정|전망|계획)(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에)/gu,rep:'需給 $1'},
    {re:/(연금|급여|실업급여|지원금|보조금)\s+수급(?=\s|$|[,.!?，。！？]|자|권|이|가|은|는|을|를|에|의)/gu,rep:'$1 受給'},
    {re:/수급\s+(자격|권자|요건)(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에)/gu,rep:'受給 $1'},

    // 전형: 典型 only in clearly typological contexts; admissions usage remains protected.
    {re:/전형적(?=인|으로|이다|입니다|이라고)/gu,rep:'典型的'},
    {re:/전형적인\s+(사례|예|모습|패턴|특징)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'典型的인 $1'},

    // 편성: 編成 in budget/organization/programming contexts.
    {re:/(예산|조직|부대|팀|방송|프로그램)\s+편성(?=표|\s|$|[,.!?，。！？]|을|를|이|가|은|는|에|하|되)/gu,rep:'$1 編成'},
    {re:/(예산|조직|부대|팀|방송|프로그램)(을|를|이|가|은|는)\s+편성(?=하|했|합|할|해|되|됐|됩|될)/gu,rep:'$1$2 編成'},
    {re:/편성\s+(계획|표|기준|작업)(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|에)/gu,rep:'編成 $1'},

    // 약자: 弱者 (vulnerable party) vs 略字 (abbreviation/shortened character).
    {re:/(사회적|경제적|교통|정보)\s+약자(?=\s|$|[,.!?，。！？]|가|는|를|의|보호|지원)/gu,rep:'$1 弱者'},
    {re:/약자\s+(보호|지원|배려)(?=\s|$|[,.!?，。！？]|를|가|는|의)/gu,rep:'弱者 $1'},
    {re:/(영문|한글|문자)\s+약자(?=\s|$|[,.!?，。！？]|가|는|를|의)/gu,rep:'$1 略字'},
    // 점: 点 in discourse/score senses only.
    {re:/(이런|그런|어떤|좋은|나쁜|중요한|특이한)\s+점(?=\s|$|[,.!?，。！？]|이|가|은|는|을|를|에서|에)/gu,rep:'$1 点'},
    {re:/(\d+)점(?=\s|$|[,.!?，。！？]|을|를|이|가|은|는|으로)/gu,rep:'$1点'}
  ];

  const PARTICLES=['으로부터','로부터','만으로는','에게서는','에게서도','에게는','에게도','에서는','에서도','에는','에도','으로는','로서는','으로서','로서','으로도','로도','와의','과의','에서','에게서','에게','한테','으로','로','까지','부터','보다','처럼','만큼','하고','와','과','의','은','는','이','가','을','를','에','도','만','뿐'];
  const COPULA_SUFFIXES=['인가요','이라고는','이라는','이라고','이라면','이라도','이라고요','이에요','예요','입니다','이다','이었다','였어요','이었어요','이고','이며','이면','이세요','인','일'];
  const CONTRACTED_COPULA_SUFFIXES=['였다','다'];
  const VERBAL_EXACT=new Set(['하다','해요','했다','합니다','하고','하는','해서','하면','한','할','함','하기','하나요','하세요','한다','했습니다','하겠습니다','할까요','하지','하지는','하지도','되다','되어','돼요','됐다','된다','됩니다','되고','되는','돼서','되면','된','될','되지','되지는','되도록','시키다','시켜요','시켰다','시킵니다','시키고','시키는','시키면','시킨','시킬']);
  const VERBAL_PREFIXES=['하','해','했','합','됩','되','돼','됐','시키','시켜','시켰','시킵','스럽','스러'];
  const DERIVATIONAL_SUFFIXES=new Set(['히']);

  // v4.0 Stage 3 Batch 1: positive proof data for the external-candidate
  // Morphological Firewall. These are not output blacklists.
  //
  // 등 is a Korean bound noun that productively takes particles (등이, 등과).
  // Predicate lemmas generate only a narrow, predeclared set of inflected
  // forms in engine.js; arbitrary suffix stripping is forbidden.
  const FIREWALL_GRAMMATICAL_BASES=new Set(['등','중']);
  const FIREWALL_PREDICATE_LEMMAS=new Set(['보다','비하다','관하다']);

  // v3.2 Fresh corpus v2 batch 3.
  // Productive noun + 받다 is opt-in only. Do not treat 받다 as a global verbal suffix.
  const RECEIVE_PASSIVE_BASES=new Set(['발급','안내','처방','재발급']);

  // v3.5: words that may be safe as standalone lexemes but are unsafe
  // as generic compound components without contextual disambiguation.
  // Keep this list narrow; exact/reviewed forms still take precedence.
  const COMPOUND_BLOCKED_PARTS=new Set([
    '대기',
    // v3.9 Phase E Batch 1: keep exact financial 이자=利子 available, but
    // do not compose grammatical/copular -이자 as an unreviewed noun component.
    '이자',
  ]);

  // v3.2 Fresh corpus v2 batch 6.
  // Reviewed segmentation only: every part must already be independently safe.
  // This is intentionally not a generic Hangul compound segmenter.
  const REVIEWED_COMPOUND_FORMS={
    // v3.5 generic composition: reviewed context-sensitive equipment compounds.
    '발전설비':'発電設備',
    '신호설비':'信号設備',
    // v3.6: compact commercial-document form matching the existing reviewed
    // spaced context 거래 명세서 -> 去来 明細書.
    '거래명세서':'去来明細書',
    '접수상태':'受付状態',
    '미수금목록':'未収金목록',
    '버스노선변경안':'バス路線変更안',
    '출고예정량':'출고予定量',
    '하역장비교체시기':'하역装備交替시기',
    '음원사용허가서':'音源使用허가서',
    '보안사고발생시':'保安事故発生시',
    '사고예방수칙':'事故予防수칙',
    // v3.5 unseen residual: reviewed low-ambiguity exact surfaces.
    '정상화':'正常化',
    '병동근무표':'病棟勤務表',
    '냉난방설비':'冷暖房設備',
    '하천수위관측소':'河川水位観測所',
    '재정비':'再整備',
    '온라인서점':'オンライン書店',
    '계정관리자':'アカウント管理者',
    '알림설정':'알림設定',
    '비밀번호변경주기':'비밀번호変更周期',
    '서버장애발생시':'サーバー障害発生시',
    '이수여부':'履修여부',
    '부작용발생여부':'부작용発生여부',
    '공연예매사이트':'公演予約사이트',
    '정책추진일정':'政策推進日程',
    '보수필요성':'補修必要性',
    '가족관계증명서':'家族関係証明書',
    '건강보험증':'健康保険証',
    '검사결과':'検査結果',
    '결과표':'結果表',
    '고장진단':'故障診断',
    '배터리수명':'バッテリー寿命',
    // Fresh corpus v2 batch 8: reviewed residual compounds.
    '무인민원발급기':'無人民願発給機',
    '다중이용시설':'多衆利用施設',
    '모델검증':'モデル検証',
    '녹화본':'録画本',

    // Fresh corpus v2 batch 9:
    // low-ambiguity reviewed exact surfaces only.
    '주민센터':'住民センター',
    '민원실':'民願室',
    '주민등록':'住民登録',
    '재활용품':'再活用品',
    '분리수거':'分離収去',
    '수도요금':'水道料金',
    '전입신고':'転入申告',
    '보건증':'保健証',
    '주민등록증':'住民登録証',
    '공영주차장':'公営駐車場',
    '집중호우':'集中豪雨',
    '민방위':'民防衛',
    '문자메시지':'文字メッセージ',

    '국제선':'国際線',
    '탑승권':'搭乗券',
    '좌석번호':'座席番号',
    '취소수수료':'取消手数料',
    '출발시간':'出発時間',
    '고속도로':'高速道路',

    '부서장':'部署長',
    '전자결재':'電子決裁',
    '법인카드':'法人カード',
    '매출액':'売出額',

    // Fresh corpus v2 batch 10:
    // reviewed low-ambiguity exact surfaces.
    '거래처':'去来処',
    '고객사':'顧客社',
    '근무일':'勤務日',
    '단말기':'端末機',
    '복약지도':'服薬指導',
    '세금계산서':'税金計算書',

    '경고':'警告',
    '관광지':'観光地',
    '구조물':'構造物',
    '근태':'勤怠',
    '납품':'納品',
    '도심':'都心',
    '등본':'謄本',
    '매월':'毎月',
    '명시':'明示',
    '명확':'明確',
    '방송부':'放送部',
    '배송':'配送',
    '변수':'変数',
    '병용':'併用',
    '분포':'分布',
    '불규칙':'不規則',
    '불확실성':'不確実性',
    '사실확인':'事実確認',

    // Fresh corpus v2 batch 12:
    // reviewed low-ambiguity compound / domain surfaces.
    '수강신청':'受講申請',
    '수면시간':'睡眠時間',
    '소방서':'消防署',
    '숙박비':'宿泊費',
    '승강장':'乗降場',
    '승객':'乗客',
    '승차권':'乗車券',
    '시립':'市立',
    '시외버스':'市外バス',
    '신호처리':'信号処理',
    '실험장치':'実験装置',
    '심박수':'心拍数',
    '안전계수':'安全係数',

    // Fresh corpus v2 batch 13:
    // reviewed low-ambiguity compound/domain surfaces.
    '수하물':'手荷物',
    '순환버스':'循環バス',
    '안내판':'案内板',
    '연구윤리':'研究倫理',
    '연말정산':'年末精算',
    '영업이익':'営業利益',
    '예방교육':'予防教育',
    '예방접종':'予防接種',
    '예약제':'予約制',

    // Fresh corpus v2 batch 14:
    // reviewed low-ambiguity compound/domain surfaces.
    '온라인강의':'オンライン講義',
    '외래진료':'外来診療',
    '원무과':'院務課',
    '유효기간':'有効期間',
    '응급실':'救急室',

    // Fresh corpus v2 batch 15:
    // reviewed low-ambiguity compound/domain surfaces.
    '의료비':'医療費',
    '이상치':'異常値',
    '이용권':'利用券',
    '인력':'人力',
    '운임':'運賃',
    '유람선':'遊覧船',

    // Fresh corpus v2 batch 16:
    // reviewed low-ambiguity compound/domain surfaces.
    '인사팀':'人事チーム',
    '인수인계':'引受引継',
    '인용표기':'引用表記',
    '입력':'入力',
    '완료':'完了',
    '응답':'応答',
    // Fresh corpus v2 batch 18: compounds whose first component is ambiguous
    // alone (재고: 在庫/再考/재다+고, 전력: 電力/全力/前歴).
    '재고관리':'在庫管理',
    '전력소비':'電力消費',
    // Fresh corpus v2 batch 19: 검사(検査/検事), 주의(注意/主義),
    // 일정(日程/一定), 수(dependent noun) stay unsafe alone.
    '품질검사':'品質検査',
    '주의사항':'注意事項',
    '장학제도':'奨学制度',
    '표본수':'標本数',
    '학사일정':'学事日程',
    // Fresh corpus v2 batch 20
    '제출용':'提出用',
    // Fresh corpus v2 batch 22: reviewed exact/partial compounds.
    '재활운동':'再活運動',
    '입원절차':'入院節次',
    '전기차':'電気車',
    '환승센터':'換乗センター',
    '정보보안':'情報保安',
    '측정값':'測定값',
    '쓰레기봉투':'쓰레기封套',
    // v3.3 unseen corpus 1 batch 4: reviewed exact compounds only.
    '개정판':'改訂版',
    '공공요금':'公共料金',
    '관리비':'管理費',
    '관리사무소':'管理事務所',
    '급속충전기':'急速充電器',
    '기상특보':'気象特報',
    '납부기한':'納付期限',
    '납입증명서':'納入証明書',
    '대기전력':'待機電力',
    '발전량':'発電量',
    '번호인식':'番号認識',
    '보수공사':'補修工事',
    '보수작업':'補修作業',
    '보존기간':'保存期間',
    '복용방법':'服用方法',
    '분리배출':'分離排出',
    '선로점검':'線路点検',
    // v3.3 unseen corpus 1 batch 5: reviewed exact compounds only.
    '간병서비스':'看病サービス',
    '결제내역':'決済内訳',
    '고객센터':'顧客センター',
    '공동현관':'共同玄関',
    '녹화파일':'録画ファイル',
    '보안교육':'保安教育',
    '설비상태':'設備状態',
    '소득공제':'所得控除',
    '수도계량기':'水道計量器',
    '수정내역':'修正内訳',
    '수정본':'修正版',
    '신호체계':'信号体系',
    '실행기록':'実行記録',
    '안전계획':'安全計画',
    '약정이율':'約定利率',
    '여객선':'旅客船',
    // v3.3 unseen corpus 1 batch 6: reviewed exact compounds only.
    '대출기록':'貸出記録',
    '대피장소':'待避場所',
    '상담인력':'相談人力',
    '예약인원':'予約人員',
    '우회노선':'迂回路線',
    '운영시간':'運営時間',
    '운영위원회':'運営委員会',
    '운행시간':'運行時間',
    '응급환자':'応急患者',
    '인사평가':'人事評価',
    '인용문':'引用文',
    // v3.3 unseen corpus 1 batch 7: reviewed exact surfaces.
    '승강기':'昇降機',
    '장기수선계획':'長期修繕計画',
    '입사자':'入社者',
    '암호화':'暗号化',
    '입원수속':'入院手続',
    '동영상':'動画',
    '산책로':'散策路',
    '일반차량':'一般車両',
    '자전거도로':'自転車道路',
    '일사량':'日射量',
    '삭제':'削除',
    '외부':'外部',
    '메신저':'メッセンジャー',
    '보일러':'ボイラー',
    '자동이체':'自動振替',
    // v3.3 unseen corpus 1 batch 8: reviewed exact surfaces.
    '정기검사':'定期検査',
    '전기요금':'電気料金',
    '재건축':'再建築',
    '의결':'議決',
    '열람':'閲覧',
    '정정기간':'訂正期間',
    '입장시간':'入場時間',
    '재생시간':'再生時間',
    '입구':'入口',
    '자동납부':'自動納付',
    // v3.3 unseen corpus 1 batch 9: reviewed exact surfaces.
    '지방세':'地方税',
    '소득':'所得',
    '예금':'預金',
    '주기적':'周期的',
    '조정안':'調整案',
    '조제':'調剤',
    '이중':'二重',
    '주민설명회':'住民説明会',
    '주차등록':'駐車登録',
    '주차장':'駐車場',
    '중복게재':'重複掲載',
    '중증도':'重症度',
    // v3.3 unseen corpus 1 batch 10: reviewed exact surfaces.
    '채무':'債務',
    '직후':'直後',
    '계좌':'口座',
    '차단기':'遮断器',
    '출입구':'出入口',
    '추진위원회':'推進委員会',
    '접근권한':'アクセス権限',
    '직전':'直前',
    '접수창구':'受付窓口',
    '투약':'投薬',
    '마감일':'締切日',
    '출입':'出入',
    '첫차':'始発',
    '태양광':'太陽光',
    // v3.3 unseen corpus 1 batch 11: reviewed exact surfaces.
    '현금영수증':'現金領収証',
    '해외송금':'海外送金',
    '파일전송':'ファイル転送',
    '환경설정':'環境設定',
    '환자명':'患者名',
    '회복상태':'回復状態',
    '학술대회':'学術大会',
    '특별전':'特別展',
    '해외여행':'海外旅行',
    '행동요령':'行動要領',
    '대중교통':'公共交通',
    '버스전용차로':'バス専用車線',
    '진입':'進入',
    '전날':'前日',
    '입주자대표회의':'入居者代表会議',
    '교차로':'交差点',
    '정체시간':'渋滞時間',
    // v3.3 unseen corpus 1 batch 12: reviewed exact surfaces.
    '할부금액':'分割払金額',
    '화상회의':'ビデオ会議',
    '백업본':'バックアップコピー',
    '재활치료':'リハビリ治療',
    '지역축제':'地域祭り',
    // v3.3 unseen corpus 1 batch 13: Korean-specific reviewed term.
    '전세계약':'チョンセ契約',
    // v3.3 unseen corpus 2 batch 1: reviewed exact/domain surfaces.
    '공공기관':'公共機関',
    '과태료':'過料',
    '등기부등본':'登記簿謄本',
    '법정기한':'法定期限',
    '물류센터':'物流センター',
    '배송지연':'配送遅延',
    '원산지증명서':'原産地証明書',
    '로그파일':'ログファイル',
    '오류코드':'エラーコード',
    '장애복구':'障害復旧',
    '응답시간':'応答時間',
    '활력징후':'バイタルサイン',
    '정상범위':'正常範囲',
    '수술기록':'手術記録',
    '영상검사':'画像検査',
    '검체보관':'検体保管',
    '수질검사':'水質検査',
    '잔류염소':'残留塩素',
    '태양광발전소':'太陽光発電所',
    // v3.3 unseen corpus 2 batch 2: reviewed exact/domain surfaces.
    '권리관계':'権利関係',
    '납부방법':'納付方法',
    '미수금':'未収金',
    '반품상품':'返品商品',
    '검수':'検収',
    '배상조건':'賠償条件',
    '납품수량':'納品数量',
    '단가':'単価',
    '공급업체':'供給業者',
    '배포파이프라인':'デプロイパイプライン',
    '보안취약점':'セキュリティ脆弱性',
    '백업정책':'バックアップポリシー',
    '마취방법':'麻酔方法',
    '병변':'病変',
    '멸균':'滅菌',
    '기준범위':'基準範囲',
    '대학원생':'大学院生',
    '교외접속':'学外アクセス',
    '기사제목':'記事タイトル',
    '사진설명':'写真キャプション',
    '보호지침':'保護指針',
    '교육프로그램':'教育プログラム',
    '독자반응':'読者反応',
    '사실관계':'事実関係',
    '대기질':'大気質',
    '강우량':'降雨量',
    '감지센서':'検知センサー',
    '경보장치':'警報装置',
    '교량':'橋梁',
    '균열폭':'亀裂幅',
    '부식상태':'腐食状態',
    // v3.3 unseen corpus 2 batch 3: reviewed exact/domain surfaces.
    '심판':'審判',
    '부동산':'不動産',
    '상정':'上程',
    '답변':'回答',
    '신빙성':'信憑性',
    '분쟁':'紛争',
    '온라인몰':'オンラインモール',
    '수출업체':'輸出業者',
    '선적':'船積み',
    '운송계약':'運送契約',
    '분실':'紛失',
    '암호키':'暗号鍵',
    '예외처리':'例外処理',
    '원인분석':'原因分析',
    '염증수치':'炎症値',
    '약물부작용':'薬物副作用',
    '연구목적':'研究目的',
    '실험기구':'実験器具',
    '운동강도':'運動強度',
    '연구계획서':'研究計画書',
    '방송사':'放送局',
    '속보':'速報',
    '송출':'送出',
    '연령대':'年齢層',
    '상수도':'上水道',
    '신호장치':'信号装置',
    '선별공정':'選別工程',
    '오존':'オゾン',
    '시간대':'時間帯',
    '산사태':'土砂崩れ',
    // v3.3 unseen corpus 2 batch 4: reviewed exact/domain surfaces.
    '인감증명서':'印鑑証明書',
    '이의제기':'異議申立て',
    '접수번호':'受付番号',
    '인사발령':'人事発令',
    '재고수량':'在庫数量',
    '입출고':'入出庫',
    '월말':'月末',
    '재판매':'再販売',
    '정기구독':'定期購読',
    '접근정책':'アクセスポリシー',
    '전체백업':'フルバックアップ',
    '장애보고서':'障害報告書',
    '재발방지':'再発防止',
    '의식수준':'意識レベル',
    '임상시험':'臨床試験',
    '유전체':'ゲノム',
    '위험인자':'危険因子',
    '재검사':'再検査',
    '의견서':'意見書',
    '전자자료':'電子資料',
    '인증':'認証',
    '자막':'字幕',
    '유입량':'流入量',
    '이상유무':'異常有無',
    '일사조건':'日射条件',
    '자동정지':'自動停止',
    '재활용센터':'リサイクルセンター',
    '위험지역':'危険地域',
    // v3.3 unseen corpus 2 batch 5: reviewed exact/domain surfaces.
    '정보공개':'情報公開',
    '재판부':'裁判部',
    '증거능력':'証拠能力',
    '증언':'証言',
    '민원인':'申立人',
    '처리상태':'処理状態',
    '조직개편':'組織改編',
    '주문량':'注文量',
    '창고관리':'倉庫管理',
    '이력':'履歴',
    '전자세금계산서':'電子税金計算書',
    '복제본':'レプリカ',
    '처리량':'処理量',
    '최대용량':'最大容量',
    '증분백업':'増分バックアップ',
    '처방용량':'処方用量',
    '참여자':'参加者',
    '지도교수':'指導教授',
    '준수':'遵守',
    '체험활동':'体験活動',
    '초판':'初版',
    '정정보도':'訂正報道',
    '처리공정':'処理工程',
    '차로폭':'車線幅',
    '차량속도':'車両速度',
    '철도시설':'鉄道施設',
    '선로변':'線路沿い',
    '초미세먼지':'PM2.5',
    '정밀점검':'精密点検',
    // v3.3 unseen corpus 2 batch 6: reviewed exact/domain surfaces.
    '행정처분':'行政処分',
    '회기':'会期',
    '특약사항':'特約事項',
    '판단자료':'判断資料',
    '판정':'判定',
    '통관서류':'通関書類',
    '판매가격':'販売価格',
    '해지신청':'解約申請',
    '코드리뷰':'コードレビュー',
    '파일업로드':'ファイルアップロード',
    '확장자':'拡張子',
    '출혈량':'出血量',
    '표본오염':'試料汚染',
    '회복기':'回復期',
    '출석률':'出席率',
    '현장영상':'現場映像',
    '편집국':'編集局',
    '투고논문':'投稿論文',
    '학생상담':'学生相談',
    '하수처리장':'下水処理場',
    '출력량':'出力量',
    '풍력발전기':'風力発電機',
    '측정소':'測定所',
    '택배사':'宅配会社',
    // v3.8 batch 1: reviewed exact surfaces only.
  };

  const REVIEWED_COMPOUND_PARTS={
    '학습관리시스템':['학습','관리','시스템'],
    '감염관리':['감염','관리'],
    '강의평가':['강의','평가'],
    '공공시설':['공공','시설'],
    '공공자전거':['공공','자전거'],
    '공항철도':['공항','철도'],
    '관광안내소':['관광','안내소'],
    '교통안전':['교통','안전'],
    '냉각장치':['냉각','장치'],
    '데이터처리':['데이터','처리'],
    '반복실험':['반복','실험'],
    '발표자료':['발표','자료'],
    // Fresh corpus v2 batch 18
    '측정오차':['측정','오차'],
    '통계분석':['통계','분석'],
    // Fresh corpus v2 batch 19
    '참고문헌':['참고','문헌'],
    '편집회의':['편집','회의'],
    '토론수업':['토론','수업'],
    '회로설계':['회로','설계'],
    '제어시스템':['제어','시스템']
  };
  const MIXED_PREFIX_RULES=[['예의','礼儀',new Set(['바른','바르게'])],['감사','感謝',new Set(['합니다','해요','했습니다','하고','하며','하면','한','드립니다','드려요','드렸습니다','드리고','드리며'])]];
  const JAPANESE_DISPLAY_OVERRIDES={'영양':'栄養'};
  const SAFE_FORMS={'변하다':'変하다','변해요':'変해요','변했다':'変했다','변합니다':'変합니다','변하고':'変하고','변하는':'変하는','변해서':'変해서','변하면':'変하면'};

// Lightweight Revised Romanization approximation kept separate from Hanja conversion.
  const INITIAL=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const MEDIAL=['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const FINAL=['','k','k','k','n','n','n','t','l','k','m','l','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];

const ROMANIZATION_OVERRIDES={'대한민국':'Daehanminguk','한국':'Hanguk'};
const ROMANIZATION_COMPOUNDS={'민주공화국':['민주','공화국']};

  return {
    CONTEXT_RULES,
    PARTICLES,
    COPULA_SUFFIXES,
    CONTRACTED_COPULA_SUFFIXES,
    VERBAL_EXACT,
    VERBAL_PREFIXES,
    DERIVATIONAL_SUFFIXES,
    RECEIVE_PASSIVE_BASES,
    FIREWALL_GRAMMATICAL_BASES,
    FIREWALL_PREDICATE_LEMMAS,
    REVIEWED_COMPOUND_PARTS,
    REVIEWED_COMPOUND_FORMS,
    COMPOUND_BLOCKED_PARTS,
    MIXED_PREFIX_RULES,
    JAPANESE_DISPLAY_OVERRIDES,
    SAFE_FORMS,
    INITIAL,
    MEDIAL,
    FINAL,
    ROMANIZATION_OVERRIDES,
    ROMANIZATION_COMPOUNDS
  };
});
