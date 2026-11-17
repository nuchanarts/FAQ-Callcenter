import type { ManualTab, Row } from "@/domain/manuals";

/**
 * Built-in copy of the manual library (snapshot of the team's Google Sheet, Nov 2569).
 * Shown when MANUALS_SHEET_ID is unset or the Sheet can't be reached, so the page never breaks.
 * Same row shape as the Sheet tabs: header key → cell text.
 */
export const BASE_MANUAL_ROWS: Record<ManualTab, Row[]> = {
  news: [
    {
      order: "1",
      badge: "เริ่ม 1 ธ.ค. 2569",
      date: "ธ.ค. 2569",
      title: "เตรียมความพร้อมส่งข้อมูลเข้าระบบ FDH",
      body: "สป.สธ. ปรับปรุงโครงสร้างชุดข้อมูล Financial Data Set (FDS) ครั้งที่ 2/2569 (หนังสือ ที่ สธ 0210.10/ว 11906 ลว. 26 ส.ค. 2569) เพื่อให้หน่วยบริการส่งข้อมูลมายัง FDH (Financial Data Hub) ได้ครบทุกบริการ · กำหนดเริ่มส่ง 1 ธันวาคม 2569\nระหว่างนี้ให้ส่งข้อมูลตามช่องทางปัจจุบันตามปกติ จนกว่าจะมีแจ้งเปลี่ยนแปลง · ข้อควรระวัง: ไม่ส่งรายการเดียวกันซ้ำหลายช่องทาง รายการที่ส่งเข้า FDH แล้ว ไม่ต้องส่ง 13 แฟ้มพลัส ให้ สปสช. ซ้ำ\nเตรียมความพร้อม: 1) ตรวจข้อมูลด้วย Datacheck ของเขตสุขภาพ แก้รายการ BLOCK ให้หมด 2) บุคลากรผู้ให้บริการ: เลขบัตรประชาชน เลขใบประกอบวิชาชีพ Provider Type ให้ครบ 3) ผูกรหัสสิทธิ ค่าบริการ หัตถการ 4) ยาผูก TMT / Lab ผูก TMLT 5) เคลียร์รายการค้างส่ง 6) ขอบัญชี FDH ของ รพ.สต.\nติดต่อสอบถาม ระบบและบัญชี FDH: LINE OpenChat FDH@MOPH · โทร 080-076-4292 | การเบิกจ่ายกับ สปสช.: สายด่วน 1330 กด 5",
      link1_label: "วิดีโอ: ตั้งค่าและส่งข้อมูลเข้า FDH (3 นาที)",
      link1_url: "https://www.youtube.com/watch?v=f-2Sqkqzm8s",
      link2_label: "One Page: การส่งข้อมูล 13 แฟ้มพลัส",
      link2_url: "https://drive.google.com/file/d/1UGZa_IAQv0QszVGOZUbR9HCWqhlOdIbh/view",
      link3_label: "เอกสาร FDS ปี 2569 (ปรับปรุงครั้งที่ 2)",
      link3_url: "https://moph.link/LFwTVWk0y",
      link4_label: "วิธีขอบัญชี FDH ของ รพ.สต.",
      link4_url: "https://dhes.moph.go.th/?p=18081",
      link5_label: "ระบบ FDH (สำหรับผู้มีบัญชีแล้ว)",
      link5_url: "https://fdh.moph.go.th/hospital/",
      link6_label: "LINE OpenChat FDH@MOPH",
      link6_url: "https://line.me/ti/g2/8KmaJMZviG4Q0AT3grNuB_ftVeq9IPq0cCLe8A",
    },
    {
      order: "2",
      badge: "NEW",
      date: "ต.ค. 2569",
      title: "อัปเดตแพลตฟอร์มกลาง รพ.สต. เดือนตุลาคม 2569",
      body: "ฟังก์ชันใหม่ 17 รายการ และปรับปรุงของเดิม 12 รายการ · เกี่ยวข้องกับงาน One Stop Service มากที่สุด รวมถึงงานการเงิน นัดหมาย ส่งออกประกันสังคม เบิกสินค้า ทะเบียนบัญชี 1-6 วัคซีน คลังยา/เวชภัณฑ์ และ Drug Catalog",
      link1_label: "วิดีโอแนะนำฟังก์ชันใหม่ (5 นาที · มีสารบัญแยกหัวข้อ)",
      link1_url: "https://www.youtube.com/watch?v=cZRKXFHjnjg",
    },
  ],
  datacheck: [
    {
      region: "1",
      url: "https://pcu1.moph.go.th/datacheck",
      provinces: "เชียงใหม่ · เชียงราย · ลำปาง · ลำพูน · แม่ฮ่องสอน · น่าน · พะเยา · แพร่",
    },
    {
      region: "2",
      url: "https://pcu2.moph.go.th/datacheck",
      provinces: "พิษณุโลก · ตาก · เพชรบูรณ์ · สุโขทัย · อุตรดิตถ์",
    },
    {
      region: "3",
      url: "https://pcu3.moph.go.th/datacheck",
      provinces: "นครสวรรค์ · กำแพงเพชร · พิจิตร · อุทัยธานี · ชัยนาท",
    },
    {
      region: "4",
      url: "https://pcu4.moph.go.th/datacheck",
      provinces: "สระบุรี · นนทบุรี · ปทุมธานี · พระนครศรีอยุธยา · อ่างทอง · ลพบุรี · สิงห์บุรี · นครนายก",
    },
    {
      region: "5",
      url: "https://pcu5.moph.go.th/datacheck",
      provinces:
        "ราชบุรี · กาญจนบุรี · สุพรรณบุรี · นครปฐม · สมุทรสาคร · สมุทรสงคราม · เพชรบุรี · ประจวบคีรีขันธ์",
    },
    {
      region: "6",
      url: "https://pcu6.moph.go.th/datacheck",
      provinces: "ชลบุรี · ระยอง · จันทบุรี · ตราด · ฉะเชิงเทรา · ปราจีนบุรี · สระแก้ว · สมุทรปราการ",
    },
    {
      region: "7",
      url: "https://pcu7.moph.go.th/datacheck",
      provinces: "ขอนแก่น · กาฬสินธุ์ · มหาสารคาม · ร้อยเอ็ด",
    },
    {
      region: "8",
      url: "https://pcu8.moph.go.th/datacheck",
      provinces: "อุดรธานี · สกลนคร · นครพนม · เลย · หนองคาย · หนองบัวลำภู · บึงกาฬ",
    },
    {
      region: "9",
      url: "https://pcu9.moph.go.th/datacheck",
      provinces: "นครราชสีมา · ชัยภูมิ · บุรีรัมย์ · สุรินทร์",
    },
    {
      region: "10",
      url: "https://pcu10.moph.go.th/datacheck",
      provinces: "อุบลราชธานี · ศรีสะเกษ · ยโสธร · อำนาจเจริญ · มุกดาหาร",
    },
    {
      region: "11",
      url: "https://pcu11.moph.go.th/datacheck",
      provinces: "สุราษฎร์ธานี · นครศรีธรรมราช · กระบี่ · พังงา · ภูเก็ต · ระนอง · ชุมพร",
    },
    {
      region: "12",
      url: "https://pcu12.moph.go.th/datacheck",
      provinces: "สงขลา · สตูล · ตรัง · พัทลุง · ปัตตานี · ยะลา · นราธิวาส",
    },
  ],
  onepage: [
    {
      order: "1",
      title: "คู่มือระบบ ONE STOP SERVICE (ยกเลิกใบแจ้งหนี้ / โอนค่าใช้จ่าย)",
      url: "https://drive.google.com/file/d/1fEg3l3lARmR_cDi7m_S_2DwqQC1jfGkP/view",
    },
    {
      order: "2",
      title: "การตั้งค่าข้อมูลสิทธิ เพื่อตรวจสอบสิทธิ ส่งออก และค่าใช้จ่าย",
      url: "https://drive.google.com/file/d/1uorCOZ1kDtGKjzZk8CB72ZlKzSHw9xHY/view",
    },
    {
      order: "3",
      title: "การตั้งค่า Token และดึงข้อมูลจาก New Authen",
      url: "https://drive.google.com/file/d/1REp1Yx_GbqTcxb-FjVEvhLv6wcFdV68v/view",
    },
    {
      order: "4",
      title: "การส่ง E-Claim ทั้งหมด (หน้า Visit List)",
      url: "https://drive.google.com/file/d/1O4MYFkKBqEXPq-iEFqvSYhEG6Y_e8fAw/view",
    },
    {
      order: "5",
      title: "การส่งข้อมูล 13 แฟ้มพลัส และการตั้งค่าก่อนส่งออก",
      url: "https://drive.google.com/file/d/1UGZa_IAQv0QszVGOZUbR9HCWqhlOdIbh/view",
    },
    {
      order: "6",
      title: "การส่งตรวจล่วงหน้า",
      url: "https://drive.google.com/file/d/160egDqGrmkLPzN4dXi4FTI1ZrGS6Reaw/view",
    },
    {
      order: "7",
      title: "การออกใบรับรองแพทย์ (Template ความคิดเห็นแพทย์)",
      url: "https://drive.google.com/file/d/1IZkW9gBBVqQ_OsY6xmd5hETHKBE4qyD4/view",
    },
    {
      order: "8",
      title: "ขั้นตอนการส่ง MOPH Claim (EPI)",
      url: "https://drive.google.com/file/d/1Sn0O5AHvTAs01XoeSPWRrZio-w1maKXb/view",
    },
    {
      order: "9",
      title: "ขั้นตอนการส่งออกงานระบาดวิทยา",
      url: "https://drive.google.com/file/d/1K1Apg0Uqp6qnXQEQcms2CERUBqpTY-9c/view",
    },
    {
      order: "10",
      title: "วิธีการคีย์แทนแพทย์ (กรณีพนักงานคีย์ข้อมูล)",
      url: "https://drive.google.com/file/d/1_sta6Fq_zEbxG5h7o8OhACRcA-1Ebv2Z/view",
    },
    {
      order: "11",
      title: "วิธีส่งออกประกันสังคม",
      url: "https://drive.google.com/file/d/1h0eZG_Hc4Wo-LGFo867sXfSIjlyxOmlU/view",
    },
    {
      order: "12",
      title: "แจ้งวิธีแก้ปัญหาล็อกอินเข้าที่อื่น",
      url: "https://drive.google.com/file/d/1v9uEAZlIJ9WBTOd87tHqpXSxTH4cHEPC/view",
    },
  ],
  videos: [
    {
      order: "1",
      category: "One Stop Service",
      title: "การบันทึกข้อมูลทั่วไป",
      url: "https://www.youtube.com/watch?v=RKje_mDM9SE",
    },
    {
      order: "2",
      category: "One Stop Service",
      title: "การบันทึกสิทธิการรักษา",
      url: "https://www.youtube.com/watch?v=0qL6sPP5lX0",
    },
    {
      order: "3",
      category: "One Stop Service",
      title: "การบันทึกส่งตรวจ ในหน้าจอ ส่งตรวจผู้ป่วย",
      url: "https://www.youtube.com/watch?v=46coNCIhyHw",
    },
    {
      order: "4",
      category: "One Stop Service",
      title: "การบันทึกการแพ้ยา",
      url: "https://www.youtube.com/watch?v=sMzrzhkZ3Eo",
    },
    {
      order: "5",
      category: "One Stop Service",
      title: "การบันทึกโรคประจำตัว",
      url: "https://www.youtube.com/watch?v=CsrfM1u2rKs",
    },
    {
      order: "6",
      category: "One Stop Service",
      title: "การบันทึก Audit",
      url: "https://www.youtube.com/watch?v=RfP7VRdMVFA",
    },
    {
      order: "7",
      category: "One Stop Service",
      title: "การบันทึกการพิมพ์เอกสาร",
      url: "https://www.youtube.com/watch?v=JPugPQN8oew",
    },
    {
      order: "8",
      category: "One Stop Service",
      title: "การบันทึกการนัดหมาย",
      url: "https://www.youtube.com/watch?v=ee1v9ytnVWc",
    },
    {
      order: "9",
      category: "One Stop Service",
      title: "การบันทึกข้อมูลปกปิด",
      url: "https://www.youtube.com/watch?v=TLdwaJwFgqY",
    },
    {
      order: "10",
      category: "One Stop Service",
      title: "การบันทึกการแพ้อาหาร",
      url: "https://www.youtube.com/watch?v=3iNdPU_E68Q",
    },
    {
      order: "11",
      category: "One Stop Service",
      title: "การบันทึกสถานะพิเศษ",
      url: "https://www.youtube.com/watch?v=2BOaZTIJgSQ",
    },
    {
      order: "12",
      category: "One Stop Service",
      title: "การบันทึกการคัดกรอง",
      url: "https://www.youtube.com/watch?v=HHaRCcChl7M",
    },
    {
      order: "13",
      category: "One Stop Service",
      title: "การบันทึกประวัติ",
      url: "https://www.youtube.com/watch?v=eYHPGMN1bvk",
    },
    {
      order: "14",
      category: "One Stop Service",
      title: "การบันทึกตรวจร่างกาย",
      url: "https://www.youtube.com/watch?v=cuociSljymA",
    },
    {
      order: "15",
      category: "One Stop Service",
      title: "การบันทึกหัตถการ",
      url: "https://www.youtube.com/watch?v=SdLNWFWEKNg",
    },
    {
      order: "16",
      category: "One Stop Service",
      title: "การบันทึกวินิจฉัย",
      url: "https://www.youtube.com/watch?v=lxJfFDDszIY",
    },
    {
      order: "17",
      category: "One Stop Service",
      title: "การบันทึกสั่งยา",
      url: "https://www.youtube.com/watch?v=yvkA1PSuOzM",
    },
    {
      order: "18",
      category: "One Stop Service",
      title: "การลงข้อมูลนัดหมาย",
      url: "https://www.youtube.com/watch?v=11yfhOrrH-w",
    },
    {
      order: "19",
      category: "One Stop Service",
      title: "การบันทึกการตรวจ Lab",
      url: "https://www.youtube.com/watch?v=3hCz00Brkh4",
    },
    {
      order: "20",
      category: "One Stop Service",
      title: "การบันทึกทันตกรรม",
      url: "https://www.youtube.com/watch?v=ssERxbBlu5A",
    },
    {
      order: "21",
      category: "One Stop Service",
      title: "การบันทึกแพทย์แผนไทย",
      url: "https://www.youtube.com/watch?v=xRUAG3GzDDs",
    },
    {
      order: "22",
      category: "One Stop Service",
      title: "การบันทึกวัคซีน",
      url: "https://www.youtube.com/watch?v=5MJfPxKkpBs",
    },
    {
      order: "23",
      category: "One Stop Service",
      title: "การบันทึกใบรับรอง",
      url: "https://www.youtube.com/watch?v=wKuqRP0oaxw",
    },
    {
      order: "24",
      category: "One Stop Service",
      title: "การบันทึกโรคเรื้อรัง",
      url: "https://www.youtube.com/watch?v=HljRnzjWBFc",
    },
    {
      order: "25",
      category: "One Stop Service",
      title: "งานป้องกันโรค",
      url: "https://www.youtube.com/watch?v=IODVWMWNUyM",
    },
    {
      order: "26",
      category: "One Stop Service",
      title: "การบันทึกการส่งตัว",
      url: "https://www.youtube.com/watch?v=UHran8J4h2c",
    },
    {
      order: "27",
      category: "One Stop Service",
      title: "การลงข้อมูลการเงิน",
      url: "https://www.youtube.com/watch?v=0z7l_oT0vxU",
    },
    {
      order: "28",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 1",
      url: "https://www.youtube.com/watch?v=uwhbLl7ZWjc",
    },
    {
      order: "29",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 2",
      url: "https://www.youtube.com/watch?v=2uG44WW0muU",
    },
    {
      order: "30",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 3",
      url: "https://www.youtube.com/watch?v=HEeQKv0qf_Q",
    },
    {
      order: "31",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 4",
      url: "https://www.youtube.com/watch?v=fHYFmargeaw",
    },
    {
      order: "32",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 5",
      url: "https://www.youtube.com/watch?v=2kAM6Ke2Sds",
    },
    {
      order: "33",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 7",
      url: "https://www.youtube.com/watch?v=bUioTenzL9Q",
    },
    {
      order: "34",
      category: "ระบบงานส่งเสริมสุขภาพ",
      title: "ระบบงานบัญชี 8",
      url: "https://www.youtube.com/watch?v=49Des6xUDOU",
    },
    {
      order: "35",
      category: "ระบบงานคลังสินค้าและการตั้งค่าระบบ",
      title: "ระบบงานคลังสินค้า",
      url: "https://www.youtube.com/watch?v=Dsa2xVruY3o",
    },
    {
      order: "36",
      category: "ระบบงานคลังสินค้าและการตั้งค่าระบบ",
      title: "การตั้งค่าหน่วยบริการ (Organization)",
      url: "https://www.youtube.com/watch?v=mi3lAw5LmFk",
    },
    {
      order: "37",
      category: "ระบบงานคลังสินค้าและการตั้งค่าระบบ",
      title: "การตั้งค่าหน่วยบริการ (Medical Expenses)",
      url: "https://www.youtube.com/watch?v=13MNrEvBuJQ",
    },
  ],
  links: [
    {
      order: "1",
      title: "เว็บไซต์ ศทส. สป.สธ.",
      description: "โครงการพัฒนาระบบคลาวด์กลางด้านสาธารณสุข",
      url: "https://ict.moph.go.th/th/page/71",
    },
    {
      order: "2",
      title: "คลังคู่มือ One Page (Google Drive)",
      description: "ไฟล์อินโฟกราฟิกฉบับเต็มและที่อัปเดตล่าสุด",
      url: "https://drive.google.com/drive/folders/1iCVfm0GP39gykkL4rvvkvUGvsEPDoDxv",
    },
    {
      order: "3",
      title: "แบบสำรวจผู้เข้าร่วมอบรม",
      description: "สแกน QR หรือคลิกเพื่อทำแบบประเมิน (Google Form)",
      url: "https://docs.google.com/forms/d/1SwvMsxTGkP_vT245zRJtLgf6-4qqqDzrSdqOmZst4sI/viewform",
    },
  ],
};
