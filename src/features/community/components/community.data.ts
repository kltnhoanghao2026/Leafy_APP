import { Expert, Post, Topic } from "./community.types";

export const currentUserAvatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD5qk4YczCELM7UkiLNUQSLWrnRVdnb5NLS94m083QHw430P54rcAHwiWhRMZ1Cp0fhg_akfwCCkAHJvtUkcXnUqP2rbMKQkkI9W2DY38SIfAnXeMj8e8x0YEQpspdJNQ13EgQBXhXT1lJ19v0cJsPYWmnw6FpGEU0KKii4KbrLScFYMwMMflbz6V6Q-YN08UrR_nARcl3PvI5fuXhDDnPGgItu6VjvftWOajMmmaAE8Anb4wWl3MmdXmVXcqaBuTYqrk-jpCrBAAyiM";

export const posts: Post[] = [
  {
    id: "post-1",
    author: "Nguyễn Văn Nam",
    authorAvatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcekA9UH_89HeDb-TlBGPh-5CxUsljKhzykjTCBBUfiFdzJnFSnGvFd_Yd2TQOBYL4lJR29gZecbhofjVdNFySxtcAo2POx0FxCt4YN-0Xdi489sGqeu3m8uyFTRrtf2qPL7lvHb0C2uJvCMiI25H8EVn3DhwCPTH31S1NvTE1Dq9KH1HqcIqlJUy8rersaAvY5GiVLI4N7sIlb1xdNvqlB4n4a5vYObN7ODsA9kO64vzs5NGvjlIWyYESqOEljSNKWBdBGkbax8C1",
    meta: "2 giờ trước • Di Linh, Lâm Đồng",
    postType: "FEED",
    content: {
      caption:
        "Lá cà phê nhà tôi xuất hiện đốm vàng lạ, có phải bị rỉ sắt không thưa chuyên gia? Mong mọi người tư vấn cách xử lý gấp để tránh lây lan cho cả vườn.",
    },
    media: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuATYFBP9t5d42j2kpupuaTF5O3H8ciGXTu7XiRDjdtRAVlrdmiddgqMIaj0hsVrR4p3DmH6F19uphD8VJLjYgIS8T8PqNCq3YWVJrZ75KejEZDlMS3Qgk_er0kLW5DDDbY9FVBdq1RfiSiHYPTwgGBI_qgTbmk8uTE23t-cC3KXvbW8aI81n4MQ1zZ41Rwb5qPEayrkqBPbJjm6xBEtApOJi7WphB6tyq4gxEaY4TB-fGw4TIy1_htWJEfgkiErzsQCZ-xFz8-ovpX",
        type: "image/jpeg",
      },
    ],
    urgent: true,
    userVote: "up",
    stats: {
      upvoteCount: 41,
      downvoteCount: 5,
      commentCount: 12,
      shareCount: 3,
    },
  },
  {
    id: "post-2",
    author: "Trần Thị Lan",
    authorAvatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCc84-kXeO8EDUgPkBtT8dSH8bayOI1SEZkhIrcxFaSzVr70GwjJajJRw9vBI-vmAjIPp7pAA6p9MmquH5tQE2jOFqDBxboxqBlhat6rikfsDYR7d_CS-z1Vjo72Vxl65sFfGh6rBizNKYtRHDyXNHLsYrwilrvA7LAHd9qfcijEDL2Fbn7i20g8tNf-RYLi5E3wAwVZKst75T0ntuPAah8Nla8BH_jEEHhUu8oFn3G6d-PHA8H91ECpJnj3UiBCoPiE10gxauONnOf",
    meta: "5 giờ trước • Buôn Ma Thuột",
    postType: "FEED",
    content: {
      caption:
        "Mùa thu hoạch năm nay cà phê chín đều và đẹp quá mọi người ơi. Hy vọng giá năm nay sẽ ổn định để bà con mình có cái Tết ấm no.",
    },
    media: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCl6KQKn2ZEUFDSuy2-LsBUh4rnRheRTjH43uPX1JM5YIvdohz1jwWpZy8lVBKOq3TYJCF4l1-X0vY64FV2aRNJTl8Rw0PZV1M4IwV_-Wln1TgRdB_EGC3weFlTJMSjUAdWW6xDjEDFyIXo-VKZ8vLL2K8Uc8n3iZp1-LBb31QKvPW6Vmk3R8apPAL1SMiluijkI9Ar9NIOKcmcBokUTuPF4QBvDXpJsljJOckaoAf3LtpQkm1HDrfbPp9iK-6ck8iTxoaEQbt47-h",
        type: "image/jpeg",
      },
    ],
    userVote: "down",
    stats: {
      upvoteCount: 172,
      downvoteCount: 14,
      commentCount: 45,
      shareCount: 5,
    },
  },
];

export const topics: Topic[] = [
  {
    id: "topic-1",
    tag: "#KỹThuậtCanhTác",
    title: "Cách ủ phân hữu cơ hiệu quả",
    audience: "1.2k người đang thảo luận",
  },
  {
    id: "topic-2",
    tag: "#ThịTrường",
    title: "Dự báo giá cà phê tuần tới",
    audience: "856 người đang quan tâm",
  },
  {
    id: "topic-3",
    tag: "#SâuBệnh",
    title: "Phòng trị rệp sáp mùa khô",
    audience: "540 người đang chia sẻ",
  },
];

export const experts: Expert[] = [
  {
    id: "expert-1",
    name: "Kỹ sư Lê Anh",
    specialty: "BVTV & Dinh dưỡng",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBos_uhnsk-McZIwy4pZxjJaJ7bjs1g7T9xN0mJZPteM3m84n4z49e_N5_Nu3Qe1GQdKHZpMdefwCuGpYFTUK4PB4E9VDk2HfEJ_sTxHqPx3-GhICwX8Yf6_TEFgIchrwIVDbcDmfhv5gLAVtCeeweHrI287Z0DuxUM49XHQOsgf4LPyWUBSE_OXiKt2CZ0N6XpF2g6KPzYsxhAOoyge1AdcOL5J3qF2QBuMa3ASacWfi7Urk4aYK4Qzh81woPVawprr7buR-7dR_QA",
  },
  {
    id: "expert-2",
    name: "TS. Nguyễn Hòa",
    specialty: "Giống cây trồng",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsZ07cSLamJK-_HafUIMUvNCSNHPdX7XXczEgyej97zYZwelNYHl7qrsJT9yxF-zwkCdYQrS5IcmuyeKcLlEL0lFLl04Rw_q9QWwOfwPwvM8CMBlRMEJBEAlQUgVcPWbfJytQ1K-aMj-mMkTDmWG4QL_cstZOPCmsXPfsWv8oYJ6G8R24Yi_NsHdCglGKU56Yt1sfvURHpvbPML4ajhG-sqpblGgTXdzk44GZzN6v054Bvmm3sUvvMu6VjeEqRTh_B9h6rjzZDapfy",
  },
];
