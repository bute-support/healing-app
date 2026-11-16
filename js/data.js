// data.js

export const categories = [
  { id: "water", label: "水", icon: "droplet" },
  { id: "rain", label: "雨", icon: "cloud-rain" },
  { id: "nature", label: "自然", icon: "leaf" },
  { id: "season", label: "季節", icon: "sun" },
  { id: "daily", label: "日常", icon: "house" },
  { id: "space", label: "空間", icon: "sparkles" },
];

// 通常音（無料）
export const sounds = [
  // 水
  {
    id:"wave-1",
    label:"波音",
    soundType: "自然の音",
    description:"寄せては返す波の音。\n海辺で過ごすような、静かなひとときを届けます。",
    category:"water",
    premium:false,
    audio:"audio/normalized-18lufs/waves.mp3",
    image:"photo/waves.jpg",
    video:"video/wave.mp4", volume:0
  },
  {
    id:"waterfall-1",
    label:"滝",
    soundType: "自然の音",
    description:"流れ落ちる水の音が、涼やかな森の空気を運んできます。",
    category:"water",
    premium:false,
    audio:"audio/normalized-18lufs/waterfall.mp3",
    image:"photo/waterfall.jpg",
    video:"video/waterfall.mp4", volume:0
  },
  {
    id:"river-1",
    label:"川のせせらぎ",
    soundType: "自然の音",
    description:"穏やかに流れる川の音。\n心が静かに凪いでいくような感覚を。",
    category:"water",
    premium:false,
    audio:"audio/normalized-18lufs/river.mp3",
    image:"photo/river.jpg",
    video:"video/river.mp4", volume:0
  },

  // 雨
  {
    id:"rain-1",
    label:"雨 1",
    soundType: "自然の音",
    description:"窓の外から聞こえる優しい雨音。\n静かな部屋で、ゆっくりとした時間を過ごすような音です。",
    category:"rain",
    premium:false,
    audio:"audio/normalized-18lufs/rain.mp3",
    image:"photo/rain.jpg",
    video:"video/rain.mp4", volume:0
  },
  {
    id:"rain-2",
    label:"雨 2",
    soundType: "自然の音",
    description:"激しい雨が窓の外を打ちつける、迫力のある雨音。\n周りの雑音を忘れ、静かに集中したい時間にも寄り添います。",
    category:"rain",
    premium:false,
    audio:"audio/normalized-18lufs/rain2.mp3",
    image:"photo/rain2.jpg",
    video:"video/rain2.mp4", volume:0
  },

  // 自然
  {
    id:"breeze-1",
    label:"風",
    soundType: "自然の音",
    description:"やわらかく吹き抜ける風の音が、肩の力をそっとほどいてくれます。",
    category:"nature",
    premium:false,
    audio:"audio/normalized-18lufs/gentle-breeze.mp3",
    image:"photo/gentle-breeze.jpg",
    video:"video/gentle-breeze.mp4", volume:0
  },
  {
    id:"leaves-1",
    label:"葉音",
    soundType: "自然の音",
    description:"木々が風に揺れる、かすかな葉音に耳をすませて。",
    category:"nature",
    premium:false,
    audio:"audio/normalized-18lufs/leaves.mp3",
    image:"photo/leaves.jpg",
    video:"video/leaves.mp4", volume:0
  },
  {
    id:"forest-1",
    label:"森の中",
    soundType: "自然の音",
    description:"木漏れ日が差し込む森の静けさを、音で感じるひととき。",
    category:"nature",
    premium:false,
    audio:"audio/normalized-18lufs/forest.mp3",
    image:"photo/forest.jpg",
    video:"video/forest.mp4", volume:0
  },
  {
    id:"bonfire-1",
    label:"焚き火",
    soundType: "自然の音",
    description:"パチパチと燃える火のゆらぎが、心を落ち着かせてくれます。",
    category:"nature",
    premium:false,
    audio:"audio/normalized-18lufs/bonfire.mp3",
    image:"photo/bonfire.jpg",
    video:"video/bonfire.mp4", volume:0
  },
  {
    id:"spring-morning-1",
    label:"春の訪れ",
    soundType: "自然の音",
    description:"目覚めの時間にそっと寄り添う、鳥たちの鳴き声。",
    category:"season",
    premium:false,
    audio:"audio/normalized-18lufs/birdsong.mp3",
    image:"photo/birdsong.jpg",
    video:"video/birdsong.mp4", volume:0
  },
  {
    id:"today-summer-insect",
    label:"夏の虫",
    soundType: "自然の音",
    description:"蝉の声や夏に響く虫たちの音色が、あの日の暑い午後を思い出させる音。\nいつもの自然音とは少し違う、季節を感じるひとときです。",
    category:"season",
    premium:true,
    audio:"audio/normalized-18lufs/summer-insect.mp3",
    image:"photo/summer-insect.jpg",
    video:"video/summer-insect.mp4", volume:0
  },
  {
    id:"autumn-insect-1",
    label:"秋の虫",
    soundType: "自然の音",
    description:"秋の夜長に響く、虫たちの静かな合唱。",
    category:"season",
    premium:false,
    audio:"audio/normalized-18lufs/insect.mp3",
    image:"photo/insect.jpg",
    video:"video/insect.mp4", volume:0
  },
  {
    id:"snow-1",
    label:"雪の日",
    soundType: "自然の音",
    description:"雪が音を吸い込むような、真っ白な静けさの中で。",
    category:"season",
    premium:false,
    audio:"audio/normalized-18lufs/snow.mp3",
    image:"photo/snow.jpg",
    video:"video/snow.mp4", volume:0
  },

  // 日常
  {
    id:"train-1",
    label:"電車の音",
    soundType: "交通音",
    description:"車窓を流れる景色とともに聞く、電車の走行音。",
    category:"daily",
    premium:false,
    audio:"audio/normalized-18lufs/train.mp3",
    image:"photo/train.jpg",
    video:"video/train.mp4", volume:0
  },
  {
    id:"street-1",
    label:"街の音",
    soundType: "街の音",
    description:"少し離れた場所から聞こえる、都会のざわめき。",
    category:"daily",
    premium:false,
    audio:"audio/normalized-18lufs/street.mp3",
    image:"photo/street.jpg",
    video:"video/street.mp4", volume:0
  },
  {
    id:"bike-1",
    label:"バイクの走行音",
    soundType: "交通音",
    description:"風を切って走るバイクの音が、旅の気分を運んできます。",
    category:"daily",
    premium:false,
    audio:"audio/normalized-18lufs/bike.mp3",
    image:"photo/bike.jpg",
    video:"video/bike.mp4", volume:0
  },
  {
    id:"plane-1",
    label:"飛行機の中",
    soundType: "交通音",
    description:"機内に響く、一定のエンジン音がもたらす不思議な安心感。",
    category:"daily",
    premium:false,
    audio:"audio/normalized-18lufs/plane.mp3",
    image:"photo/plane.jpg",
    video:"video/plane.mp4", volume:0
  },

  // 空間
  {
    id:"cafe-1",
    label:"穏やかなカフェ",
    soundType: "生活音",
    description:"窓辺の席で過ごす、カフェのやわらかな喧騒。",
    category:"space",
    premium:false,
    audio:"audio/normalized-18lufs/cafe.mp3",
    image:"photo/cafe.jpg",
    video:"video/cafe.mp4", volume:0
  },
  {
    id:"concentration-1",
    label:"集中モード",
    soundType: "生活音",
    description:"周りを気にせず、目の前のことに集中したいときに。\n長時間の勉強や作業にも使いやすい、集中のための音です。",
    category:"space",
    premium:false,
    audio:"audio/normalized-18lufs/concentration.mp3",
    image:"photo/concentration.jpg",
    video:"video/concentration.mp4", volume:0
  },
];

// 今日の音（プレミアム限定・週替わり10種類から3音を解放）
export const todaySounds = [
  {
    id:"spring-visit-1",
    label:"春の訪れ",
    soundType: "自然の音",
    description:"春の訪れを告げる、虫の声とやわらかな風の重なり。",
    category:"season",
    premium:false,
    audio:"audio/normalized-18lufs/spring-visit.mp3",
    image:"photo/spring-visit.jpg",
    video:"video/spring-visit.mp4", volume:0
  },
  {
    id:"autumn-wind",
    label:"秋風",
    soundType: "自然の音",
    description:"秋の澄んだ空気と冷たさを感じる、季節の移ろいを楽しむ音。",
    category:"season",
    premium:true,
    audio:"audio/normalized-18lufs/autumn-wind.mp3",
    image:"photo/autumn-wind.jpg",
    video:"video/autumn-wind.mp4", volume:0
  },
  {
    id:"inaka-tanbo",
    label:"田園の風",
    soundType: "自然音",
    description:"「田舎に帰ったような」特別な体験になる、田園風景の音。",
    category:"nature",
    premium:true,
    audio:"audio/normalized-18lufs/inaka-tanbo.mp3",
    image:"photo/inaka-tanbo.jpg",
    video:"video/inaka-tanbo.mp4", volume:0
  },
  {
    id:"club",
    label:"懐かしい夏",
    soundType: "生活音",
    description:"学校のグラウンドで聞こえる音。青春の記憶を思い出させる日常のサウンド。",
    category:"season",
    premium:true,
    audio:"audio/normalized-18lufs/club.mp3",
    image:"photo/club.jpg",
    video:"video/club.mp4", volume:0
  },
  {
    id:"neon",
    label:"ネオンな夜",
    soundType: "街の音",
    description:"都会の夜のざわめきとネオンの雰囲気。少し大人っぽい特別な空間を。",
    category:"space",
    premium:true,
    audio:"audio/normalized-18lufs/neon.mp3",
    image:"photo/neon.jpg",
    video:"video/neon.mp4", volume:0
  },
  {
    id:"thunder-1",
    label:"雨",
    soundType: "自然音",
    description:"雨と雷鳴が重なる迫力のある音。通常の雨とは違う体験を。",
    category:"rain",
    premium:true,
    audio:"audio/normalized-18lufs/thunder.mp3",
    image:"photo/thunder.jpg",
    video:"video/thunder.mp4", volume:0
  },
  {
    id:"thunder-2",
    label:"雨嵐",
    soundType: "自然音",
    description:"激しい雨とうなる風が重なり、自然の力強さを感じる音。\n室内で安心しながら、深く集中したい時間や眠れない夜にも寄り添います。",
    category:"rain",
    premium:true,
    audio:"audio/normalized-18lufs/thunder2.mp3",
    image:"photo/thunder2.jpg",
    video:"video/thunder2.mp4", volume:0
  },
  {
    id:"snowy-day",
    label:"雪模様",
    soundType: "自然音",
    description:"雪が降る冬の静けさ。\n季節限定の特別感を味わえます。",
    category:"nature",
    premium:true,
    audio:"audio/normalized-18lufs/snowy-day.mp3",
    image:"photo/snowy-day.jpg",
    video:"video/snowy-day.mp4", volume:0
  },
  {
    id:"pasture",
    label:"夏の放牧",
    soundType: "自然音",
    description:"広い牧草地の自然な空気。\n日常では聴きにくい特別な場所の音。",
    category:"season",
    premium:true,
    audio:"audio/normalized-18lufs/pasture.mp3",
    image:"photo/pasture.jpg",
    video:"video/pasture.mp4", volume:0
  },
  {
    id:"spring-afternoon",
    label:"ピクニック",
    soundType: "自然音",
    description:"通常の朝の音とは違う、ゆったりした昼の空気を感じられます。",
    category:"season",
    premium:true,
    audio:"audio/normalized-18lufs/spring-afternoon.mp3",
    image:"photo/spring-afternoon.jpg",
    video:"video/spring-afternoon.mp4", volume:0
  },
];
