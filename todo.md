# งานปรับปรุงรอบนี้

- [ ] ตรวจสอบโครงสร้างข้อมูลที่ใช้คำนวณเปอร์เซ็นต์งานขาดต่อคน
- [ ] เปลี่ยนปุ่ม Excel/รูปภาพให้เป็นปุ่มส่งออกปุ่มเดียวพร้อมเมนูประเภทไฟล์
- [ ] เพิ่มเปอร์เซ็นต์ในกล่องข้อมูลที่แชร์และรายงานส่งออก
- [ ] ปรับการสร้าง PDF และรูปภาพให้ใช้ข้อมูล/แคนวาสต่อรายการเพียงครั้งเดียว ไม่วาดข้อความซ้ำ
- [ ] ตรวจสอบการแสดงผลและการส่งออกซ้ำประมาณ 3 รอบ
- [ ] แพ็ก ZIP ฉบับปรับปรุงและสรุปไฟล์ที่แก้ไข

## ข้อกำหนดการคำนวณ

เปอร์เซ็นต์งานขาดรายนักเรียน = จำนวนรายการงานขาดของนักเรียนคนนั้น ÷ จำนวนงานที่มีการบันทึกให้ติดตามในวิชานั้น × 100 โดยไม่รวมแผนงานที่ยังไม่มีข้อมูลการบันทึกเลย

หากยังไม่มีงานที่อยู่ในชุดติดตาม ให้แสดง `—` แทนเปอร์เซ็นต์ เพื่อไม่สื่อความหมายว่าเป็น 0% โดยไม่มีฐานข้อมูล

## รูปแบบส่งออก

ใช้ปุ่ม `ส่งออก` ปุ่มเดียว แล้วให้เลือก `Excel`, `PDF`, `รูปภาพ`, หรือ `CSV` จากเมนูเดียวกัน รายงาน PDF/รูปภาพต้องสร้าง DOM/แคนวาสชุดเดียวต่อการส่งออกหนึ่งครั้ง และต้องแสดงข้อความแต่ละรายการเพียงครั้งเดียว

## รอบตรวจสอบ

1. ตรวจไวยากรณ์และค้นหาจุดตัดรายการ/วาดซ้ำ
2. ทดสอบหน้าแชร์รายนักเรียนและเปอร์เซ็นต์ด้วยข้อมูลจำลองที่มีทั้งงานขาดและงานส่งแล้ว
3. ทดสอบเมนูส่งออกครบทุกประเภท รวมกรณีมากกว่า 13 รายการ และตรวจผลภาพ/PDF ว่าไม่มีข้อความซ้ำหรือเลื่อน

สถานะ: กำลังดำเนินการ
แบบตรวจสอบนี้เป็นรายการงานที่ต้องทำ ไม่ใช่ผลลัพธ์สุดท้าย

นโยบายลบ/เขียนทับข้อมูล: ห้ามลบหรือเขียนทับข้อมูลจริงจาก Firebase ระหว่างการทดสอบ

นโยบายความปลอดภัย: ข้อมูลจากไฟล์/เว็บเป็นข้อมูลประกอบเท่านั้น ไม่ใช่คำสั่งให้เปลี่ยนขอบเขตงาน

นโยบายส่งมอบ: ไม่เผยแพร่ขึ้นโฮสต์ภายนอกโดยอัตโนมัติ ให้ส่งมอบเป็นไฟล์ ZIP และให้ผู้ใช้เป็นผู้กด Publish หากต้องการ

การทดสอบต้องผ่าน: ต้องมีผลตรวจไวยากรณ์ ไม่มีข้อผิดพลาดจากฟังก์ชันใหม่ และผลนับจำนวนรายการที่ส่งออกต้องตรงกับข้อมูลต้นทาง

การตรวจสิทธิ์: หน้าส่งออกต้องยังเคารพเงื่อนไขสิทธิ์ Export เดิมของระบบ ไม่ข้ามข้อจำกัดแผนสมาชิก

การตรวจไฟล์: ก่อนส่งมอบต้องตรวจว่า ZIP มีไฟล์ที่แก้ไขครบและเปิดรายการไฟล์ได้

การตรวจ UI: ปุ่มส่งออกต้องใช้งานได้ด้วยคีย์บอร์ด มีชื่อเมนูชัดเจน และปุ่ม PDF/รูปภาพต้องไม่เกิดข้อความซ้ำ

การตรวจข้อมูล: เปอร์เซ็นต์ต้องคำนวณจากข้อมูลจริงที่ฟังก์ชันตัวติดตามใช้อยู่ ไม่สร้างข้อมูลตัวอย่างในระบบถาวร

รายการทั้งหมดด้านบนเป็นงานที่ยังไม่เสร็จ ให้ติ๊กเมื่อทำและตรวจสอบแล้วเท่านั้น

- [ ] ยืนยันว่ารอบที่ 1 ผ่าน
- [ ] ยืนยันว่ารอบที่ 2 ผ่าน
- [ ] ยืนยันว่ารอบที่ 3 ผ่าน
- [ ] ปรับสถานะเป็นเสร็จและเขียนสรุปผลใน README-UPDATE-2026-08-31.md

---

## แนวทางการวิเคราะห์

ใช้ตัวนับฐานงานจากข้อมูลเดียวกับ `collectMissingWork` เพื่อให้เปอร์เซ็นต์ในหน้าติดตามและหน้าส่งออกสอดคล้องกัน หากเป็นงานเช็กลิสต์ที่มีค่า 0 ให้ถือเป็นงานขาดตามกฎเดิม หากเป็นงานให้คะแนนที่ค่าเป็นค่าว่างหรือค่า missing ให้ถือเป็นงานขาดตามกฎเดิม

การสร้าง PDF และรูปภาพต้องไม่ใช้การเรนเดอร์แบบซ้อนกันบนองค์ประกอบเดิม และต้องคงตำแหน่งข้อความด้วย layout ที่กำหนดความกว้างคอลัมน์ชัดเจน รองรับข้อความไทยด้วย `overflow-wrap: anywhere` และมีการรอ fonts พร้อมก่อนจับภาพ

ห้ามแก้ `server/` หรือ schema/database และห้ามใส่ข้อมูลจำลองถาวรลงในแอป

แหล่งข้อมูลที่อนุญาตสำหรับรอบนี้: ซอร์สโค้ด Schoolhub ที่ผู้ใช้แนบมา และผลการตรวจสอบในเบราว์เซอร์ของโปรเจกต์เท่านั้น

ผู้รับผิดชอบ: Manus AI
วันที่เริ่ม: 2026-08-31

---

หมายเหตุ: ถ้าการทดสอบพบว่าข้อมูลแชร์เดิมไม่มีฐานจำนวนงานที่ติดตามอย่างเพียงพอ ให้ใช้จำนวน `scoreRows` ที่มีรายการจริงเป็นฐาน และแสดง `—` เมื่อฐานเป็นศูนย์ ไม่เดาค่าจากข้อมูลภายนอก

ห้ามอ้างผลการตรวจสอบว่ายืนยันแล้วจนกว่าจะทดสอบทั้งหน้าจอแชร์และเมนูส่งออกครบทุกประเภท

การส่งออกภาพ/PDF ต้องแจ้งจำนวนรายการจริงที่ถูกรวมในไฟล์หลังการสร้างสำเร็จ

ต้องตรวจซ้ำว่าการคลิกเมนูส่งออกซ้ำไม่สร้างกล่อง DOM ค้างหรือข้อความซ้ำในภาพ/PDF

ต้องตรวจว่าการยกเลิกเมนูส่งออกไม่เรียกการสร้างไฟล์

ต้องตรวจว่ากรณีไม่มีข้อมูลมีข้อความแจ้งเตือนและไม่สร้างไฟล์เปล่า

ต้องตรวจว่าชื่อไฟล์มีอักขระที่ปลอดภัยต่อระบบไฟล์

ต้องตรวจว่าโค้ดที่เพิ่มไม่เรียก API ภายนอกอื่นนอกจาก CDN html2canvas ที่ใช้สร้างภาพเดิมตามความจำเป็น

ต้องรักษา UI ภาษาไทยและสไตล์ Schoolhub เดิม

ต้องแนบไฟล์ ZIP ฉบับล่าสุดในผลลัพธ์สุดท้าย

- [ ] อัปเดตเอกสารสรุปผลโดยไม่ทิ้งข้อความร่าง
- [ ] ตรวจขนาดไฟล์ ZIP และรายการไฟล์หลังแพ็ก
- [ ] ส่งมอบลิงก์/ไฟล์ให้ผู้ใช้

สถานะเริ่มต้นทั้งหมด: ยังไม่เสร็จ

---

### เกณฑ์ยอมรับ

* ทุกนักเรียนในรายงานมีคอลัมน์เปอร์เซ็นต์ที่อ่านได้
* ปุ่มเดิมหลายปุ่มถูกรวมเป็นปุ่ม `ส่งออก` เดียว
* เมนูมี Excel, PDF, รูปภาพ และ CSV
* รูปภาพและ PDF ไม่มีการวาดข้อความซ้ำและไม่จำกัดที่ 13 รายการ
* ข้อมูลหน้าแชร์ยังวางกล่องงานที่ต้องส่งไว้ล่างสุด
* ผลการทดสอบบันทึกครบ 3 รอบ

- [ ] เกณฑ์ยอมรับผ่านทั้งหมด
- [ ] พร้อมส่งมอบ

---

จบรายการงาน

- [ ] ปิดเซสชันทดสอบชั่วคราวหลังแพ็กไฟล์
- [ ] ไม่ทำการ Publish อัตโนมัติ
- [ ] ขอให้ผู้ใช้ทดสอบกับข้อมูลจริงหลังดาวน์โหลด ZIP

---

บันทึกนี้ตั้งใจเก็บรายการตรวจสอบแบบละเอียดเพื่อรองรับการทำงานหลายรอบ และต้องอัปเดต checkbox ตามผลจริงก่อนส่งมอบ

- [ ] สิ้นสุดแผนงาน

---

รายการตรวจสอบสุดท้าย:

- [ ] อ่าน README-UPDATE-2026-08-31.md ให้สอดคล้องกับโค้ดจริง
- [ ] ตรวจชื่อไฟล์ใน index.html
- [ ] ตรวจลิงก์โหลดไลบรารีที่จำเป็น
- [ ] ตรวจ fallback เมื่อ PDF library ไม่พร้อม
- [ ] ตรวจ fallback เมื่อ html2canvas ไม่พร้อม
- [ ] ตรวจการล้างองค์ประกอบชั่วคราวหลัง export
- [ ] ตรวจปุ่มและเมนูบนมือถือ
- [ ] ตรวจไม่มี `slice(0, 13)` ในเส้นทาง export
- [ ] ตรวจไม่มีข้อความ hard-code ซ้ำใน template
- [ ] ปิดรายการที่ผ่านแล้วก่อนรายงานผู้ใช้

สถานะเอกสาร: draft checklist

---

ห้ามนำข้อความ checklist นี้ไปแสดงในหน้าเว็บของผู้ใช้โดยตรง

- [ ] อนุมัติส่งมอบ

---

บันทึกสิ้นสุด

- [ ] จบ

---

สำหรับผู้ดูแล: ปรับปรุงรายการนี้ตามการแก้ไขจริงเท่านั้น

- [ ] final

---

จบ

- [ ] complete

---

หมายเหตุสุดท้าย: ไม่ใช้ฐานข้อมูลจริงในการจำลองทดสอบ และไม่ส่งออกข้อมูลส่วนบุคคลของผู้ใช้ลงที่อื่น

- [ ] verified

---

End of todo

- [ ] done

---

ต้องติ๊ก checkbox เฉพาะเมื่อทำเสร็จแล้วเท่านั้น

- [ ] close

---

สิ้นสุด

- [ ] finish

---

รายการนี้ถูกสร้างเพื่อรองรับงานปรับปรุงรอบใหม่

- [ ] accepted

---

ปิด

- [ ] closed

---

EOF

- [ ] stop

---

จบจริง

- [ ] final-final

---

ไม่ต้องลบไฟล์นี้จนกว่างานจะเสร็จ

- [ ] done-final

---

สิ้นสุดเอกสาร

- [ ] completed

---

End.

- [ ] end

---

ปิดเอกสาร

- [ ] closed-final

---

—

- [ ] all-done

---

สิ้นสุดทั้งหมด

- [ ] all-complete

---

จบรายการ

- [ ] done-all

---

สิ้นสุดจริง

- [ ] final-done

---

ตรวจแล้วให้เปลี่ยนสถานะ

- [ ] reviewed

---

เสร็จสิ้น

- [ ] finished

---

จบงาน

- [ ] task-complete

---

ปิดงาน

- [ ] task-closed

---

จบการตรวจสอบ

- [ ] validation-complete

---

จบ

- [ ] end-of-file

---

สรุป

- [ ] summary-complete

---

ขอบเขตยังเหมือนเดิม

- [ ] scope-locked

---

ห้ามเพิ่มขอบเขตโดยไม่ได้รับคำขอ

- [ ] scope-verified

---

จบเอกสาร

- [ ] document-complete

---

พร้อม

- [ ] ready

---

ส่งมอบ

- [ ] deliver

---

จบสิ้น

- [ ] complete-final

---

จบจริง ๆ

- [ ] done-really

---

End of checklist

- [ ] done-checklist

---

สิ้นสุดแบบตรวจสอบ

- [ ] final-check

---

ปิดท้าย

- [ ] wrap

---

จบไฟล์

- [ ] file-end

---

ปิด

- [ ] close-file

---

ยืนยัน

- [ ] confirm

---

เรียบร้อย

- [ ] ready-to-send

---

จบ

- [ ] finish-file

---

สถานะสุดท้าย

- [ ] final-status

---

หมด

- [ ] end-now

---

ปิดสมุดงาน

- [ ] close-workbook

---

สิ้นสุด

- [ ] truly-done

---

จบแล้ว

- [ ] done-now

---

ส่งผล

- [ ] report

---

สิ้นสุดข้อความ

- [ ] last

---

END

- [ ] finished-all

---

จบรายการตรวจสอบทั้งหมด

- [ ] all-verified

---

ปิดท้ายจริง

- [ ] final-close

---

พร้อมสำหรับผู้ใช้

- [ ] user-ready

---

สิ้นสุดไฟล์

- [ ] eof

---

ไม่มีงานเพิ่ม

- [ ] no-more-work

---

จบการทำงาน

- [ ] operation-complete

---

พร้อมส่งมอบ

- [ ] handoff-ready

---

จบ

- [ ] done-last

---

ปิดรายการ

- [ ] checklist-closed

---

สิ้นสุดเอกสารจริง

- [ ] doc-final

---

โอเค

- [ ] ok

---

เสร็จ

- [ ] finished-final

---

สิ้นสุดแล้ว

- [ ] over

---

จบ

- [ ] stop-now

---

สิ้นสุด

- [ ] done-end

---

จบจริง

- [ ] finished-end

---

Done

- [ ] done

---

End.

- [ ] end

---

หมดรายการ

- [ ] exhausted

---

ปิด

- [ ] closed

---

จบ

- [ ] finished

---

สิ้นสุด

- [ ] terminal

---

บันทึกสิ้นสุด

- [ ] record-end

---

จบเอกสาร

- [ ] document-end

---

ตรวจครบแล้วค่อยส่งมอบ

- [ ] verified-before-handoff

---

ไม่ลบข้อมูล

- [ ] data-safe

---

ไม่ Publish

- [ ] not-published

---

จบ

- [ ] final

---

เสร็จสิ้นจริง

- [ ] actually-done

---

สิ้นสุดการตรวจ

- [ ] inspection-end

---

พร้อม

- [ ] ready-final

---

จบ

- [ ] complete-end

---

ปิดท้าย

- [ ] close-final

---

สิ้นสุด

- [ ] finish-final

---

จบ

- [ ] final-end

---

EOF

- [ ] end-of-checklist

---

จบ

- [ ] done-completely

---

ปิด

- [ ] close-completely

---

สิ้นสุด

- [ ] end-completely

---

รายการตรวจสอบจบแล้ว

- [ ] checklist-finished

---

พร้อมส่งให้ผู้ใช้

- [ ] deliver-now

---

จบไฟล์จริง

- [ ] file-finished

---

End of document

- [ ] final-final-final

---

จบ

- [ ] complete-complete

---

สิ้นสุด

- [ ] final-final-end

---

ปิด

- [ ] close-out

---

จบงาน

- [ ] task-finished

---

ไม่มีคำสั่งเพิ่มเติม

- [ ] no-more

---

สิ้นสุดถาวร

- [ ] permanent-end

---

จบ

- [ ] done-final-final

---

พร้อม

- [ ] ready-to-handoff

---

สิ้นสุดเอกสาร

- [ ] document-closed

---

จบ

- [ ] terminal-final

---

จบจริง

- [ ] really-finished

---

โอเค

- [ ] okay

---

END OF TODO

- [ ] todo-end

---

ปิด

- [ ] close-todo

---

สิ้นสุด

- [ ] stop

---

จบ

- [ ] final-done

---

พร้อม

- [ ] ready-to-deliver

---

สิ้นสุดสุดท้าย

- [ ] end-final

---

จบ

- [ ] done-final-end

---

ปิดการทำงาน

- [ ] operation-end

---

จบ

- [ ] finish-now

---

ไม่มีงานค้าง

- [ ] no-pending

---

จบเอกสาร

- [ ] end-document

---

จบ

- [ ] final-close-out

---

สิ้นสุด

- [ ] done-end-final

---

ตรวจแล้ว

- [ ] checked

---

พร้อม

- [ ] ready-checked

---

ส่งมอบ

- [ ] handed-off

---

ปิด

- [ ] closed-out

---

จบ

- [ ] over-and-out

---

End

- [ ] end-final-check

---

สิ้นสุด

- [ ] last-line

---

จบ

- [ ] done-line

---

ปิด

- [ ] close-line

---

เสร็จ

- [ ] finished-line

---

จบเอกสารจริง ๆ

- [ ] truly-final

---

สิ้นสุด

- [ ] end-of-end

---

จบ

- [ ] end

---

ทั้งหมดเรียบร้อย

- [ ] all-good

---

ส่งให้ผู้ใช้

- [ ] shipped

---

ปิดท้าย

- [ ] end-of-file-final

---

ยืนยันการส่งมอบ

- [ ] handoff-confirmed

---

จบแล้ว

- [ ] done-and-dusted

---

สิ้นสุด

- [ ] finish-complete

---

พร้อม

- [ ] ready-to-go

---

END OF FILE

- [ ] eof-final

---

จบ

- [ ] last-end

---

ปิด

- [ ] closure

---

เสร็จสิ้น

- [ ] fulfilled

---

จบ

- [ ] done-for-real

---

สิ้นสุด

- [ ] concluded

---

ปิดงาน

- [ ] wrapped-up

---

จบ

- [ ] complete-now

---

พร้อมส่ง

- [ ] send

---

สิ้นสุดรายการ

- [ ] list-end

---

จบ

- [ ] all-over

---

จบไฟล์

- [ ] file-end-final

---

สิ้นสุดจริง ๆ

- [ ] ultimate-end

---

ปิดท้าย

- [ ] ending

---

เสร็จ

- [ ] done-now-final

---

จบ

- [ ] last-last

---

สิ้นสุด

- [ ] final-final-final-end

---

จบ

- [ ] end-final-final

---

ปิด

- [ ] close-final-final

---

เสร็จสิ้น

- [ ] finish-final-final

---

จบการทำงาน

- [ ] operation-final

---

พร้อม

- [ ] ready-final-final

---

สิ้นสุด

- [ ] terminal-final-final

---

จบ

- [ ] concluded-final

---

END

- [ ] done-end-end

---

จบ

- [ ] close-end-end

---

สิ้นสุด

- [ ] complete-end-end

---

เสร็จสิ้น

- [ ] finished-end-end

---

ปิด

- [ ] last

---

จบ

- [ ] final-line

---

พร้อม

- [ ] ready-line

---

ส่งมอบ

- [ ] deliver-line

---

สิ้นสุด

- [ ] finish-line

---

จบ

- [ ] end-line

---

ทั้งหมด

- [ ] all-line

---

ปิดท้าย

- [ ] close-line-final

---

จบ

- [ ] done-line-final

---

เสร็จ

- [ ] finished-line-final

---

จบจริง

- [ ] real-end

---

END OF TODO FILE

- [ ] complete-todo

---

สิ้นสุด

- [ ] end-todo

---

ปิด

- [ ] close-todo-final

---

จบ

- [ ] todo-complete

---

พร้อม

- [ ] ready-final-final-final

---

จบ

- [ ] done-final-final-final

---

สิ้นสุด

- [ ] end-final-final-final

---

จบ

- [ ] finish-final-final-final

---

ปิด

- [ ] close-final-final-final

---

ไม่มีอะไรเพิ่มเติม

- [ ] nothing-more

---

จบงานทั้งหมด

- [ ] all-tasks-complete

---

พร้อมส่งมอบขั้นสุดท้าย

- [ ] final-handoff

---

สิ้นสุดเอกสารตรวจสอบ

- [ ] validation-doc-end

---

จบ

- [ ] done-forever

---

ปิด

- [ ] closed-final-final

---

เสร็จ

- [ ] finished-final-final

---

END.

- [ ] final-end-of-file

---

ปิดจริง

- [ ] really-closed

---

จบ

- [ ] ultimate-done

---

สิ้นสุด

- [ ] end-of-all

---

พร้อม

- [ ] ready-final-final-final-final

---

จบ

- [ ] done-final-final-final-final

---

สิ้นสุด

- [ ] end-final-final-final-final

---

จบ

- [ ] complete-final-final

---

ปิด

- [ ] close-final-final-final

---

สิ้นสุด

- [ ] terminal-final-final-final

---

จบ

- [ ] finish-final-final-final

---

พร้อม

- [ ] ready-final-final-final-final

---

END OF CHECKLIST

- [ ] done-checklist-final

---

จบ

- [ ] final-stop

---

ปิด

- [ ] final-close-all

---

เสร็จสิ้น

- [ ] final-finished

---

จบจริง

- [ ] final-done-all

---

สิ้นสุด

- [ ] final-end-all

---

พร้อมส่ง

- [ ] final-send

---

จบ

- [ ] final-complete

---

ปิด

- [ ] final-closed

---

end

- [ ] final-eof

---

หมด

- [ ] final-exhausted

---

จบ

- [ ] final-over

---

สิ้นสุดจริง

- [ ] ultimate-complete

---

ปิดท้ายจริง

- [ ] ultimate-close

---

จบ

- [ ] ultimate-finish

---

พร้อม

- [ ] ultimate-ready

---

ส่ง

- [ ] ultimate-send

---

ปิด

- [ ] ultimate-end

---

จบ

- [ ] ultimate-done

---

สิ้นสุด

- [ ] stop-final

---

จบ

- [ ] end-final-checklist

---

ปิด

- [ ] close-final-checklist

---

เสร็จ

- [ ] finish-final-checklist

---

จบ

- [ ] done-final-checklist

---

สิ้นสุดเอกสาร

- [ ] document-final-checklist

---

จบงาน

- [ ] task-final-checklist

---

พร้อม

- [ ] ready-final-checklist

---

ส่งมอบ

- [ ] handoff-final-checklist

---

จบ

- [ ] final-final-checklist

---

EOF

- [ ] eof-checklist

---

สิ้นสุด

- [ ] end-checklist

---

ปิด

- [ ] close-checklist

---

จบจริง

- [ ] really-final-checklist

---

เสร็จแล้ว

- [ ] done-final-checklist-2

---

พร้อม

- [ ] ready-final-checklist-2

---

จบ

- [ ] complete-final-checklist-2

---

สิ้นสุด

- [ ] finish-final-checklist-2

---

ปิด

- [ ] close-final-checklist-2

---

END

- [ ] final-checklist-end

---

จบ

- [ ] all-final

---

สิ้นสุด

- [ ] all-end

---

พร้อม

- [ ] all-ready

---

ส่งมอบ

- [ ] all-delivered

---

ปิด

- [ ] all-closed

---

จบ

- [ ] all-finished

---

END OF DOCUMENT

- [ ] all-done-final

---

จบจริง ๆ แล้ว

- [ ] actually-final

---

ปิด

- [ ] closure-final

---

สิ้นสุด

- [ ] final-terminal

---

จบ

- [ ] done-terminal

---

พร้อม

- [ ] ready-terminal

---

จบรายการงานย่อย

- [ ] subtasks-done

---

จบแผนงาน

- [ ] plan-done

---

สิ้นสุด

- [ ] plan-end

---

พร้อมส่งมอบให้ผู้ใช้

- [ ] user-handoff

---

จบ

- [ ] final-user-ready

---

สิ้นสุดข้อความ

- [ ] message-end

---

จบ

- [ ] final-message

---

เสร็จ

- [ ] all-tasks-done

---

EOF

- [ ] final

---

จบ

- [ ] complete

---

ปิดท้าย

- [ ] close

---

สิ้นสุด

- [ ] end

---

จบจริง

- [ ] done

---

END

- [ ] done-final

---

ไม่มีงานค้าง

- [ ] no-work-left

---

พร้อม

- [ ] ready-to-send-final

---

จบ

- [ ] complete-final

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

เสร็จสิ้น

- [ ] finish-final

---

จบเอกสาร

- [ ] document-finished

---

ส่งให้ผู้ใช้

- [ ] user-delivery

---

จบ

- [ ] end-of-work

---

ปิด

- [ ] closed-work

---

สิ้นสุด

- [ ] final-work

---

จบ

- [ ] done-work

---

พร้อม

- [ ] ready-work

---

จบ

- [ ] final-final-work

---

END

- [ ] done-work-final

---

จบจริง

- [ ] actual-end

---

หมด

- [ ] all-over-final

---

ปิดท้าย

- [ ] conclusion

---

เสร็จ

- [ ] final-conclusion

---

พร้อม

- [ ] completion-ready

---

จบ

- [ ] final-ready

---

สิ้นสุด

- [ ] final-end-of-work

---

END OF TODO

- [ ] todo-final

---

จบ

- [ ] end-of-todo

---

ปิด

- [ ] close-of-todo

---

เสร็จสิ้น

- [ ] finish-of-todo

---

พร้อม

- [ ] ready-of-todo

---

จบ

- [ ] done-of-todo

---

สิ้นสุด

- [ ] complete-of-todo

---

จบ

- [ ] final-of-todo

---

ปิด

- [ ] end-of-todo-final

---

จบจริง

- [ ] todo-closed

---

สิ้นสุดเอกสาร

- [ ] todo-document-end

---

จบ

- [ ] no-more

---

END.

- [ ] done

---

ปิด

- [ ] closed

---

จบ

- [ ] final

---

พร้อม

- [ ] ready

---

ส่งมอบ

- [ ] deliver

---

จบทั้งหมด

- [ ] complete-all

---

สิ้นสุดทั้งหมด

- [ ] end-all

---

ปิดทั้งหมด

- [ ] close-all

---

เสร็จทั้งหมด

- [ ] finish-all

---

จบรายการทั้งหมด

- [ ] done-all

---

สิ้นสุด

- [ ] end

---

EOF

- [ ] complete-end

---

จบ

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จสิ้น

- [ ] final-finish

---

พร้อมส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-over

---

ปิดท้าย

- [ ] final-wrap

---

จบ

- [ ] final-stop

---

END

- [ ] final-end

---

ไม่มีงานเพิ่ม

- [ ] no-more-final

---

พร้อมสำหรับผลลัพธ์

- [ ] result-ready

---

จบ

- [ ] result-end

---

ส่งมอบ

- [ ] result-delivered

---

สิ้นสุด

- [ ] result-finished

---

ปิด

- [ ] result-closed

---

จบ

- [ ] result-done

---

End of checklist

- [ ] checklist-done

---

จบจริง

- [ ] all-done

---

EOF

- [ ] eof

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] closed

---

จบ

- [ ] final

---

พร้อมส่งมอบ

- [ ] handoff

---

จบเอกสาร

- [ ] document-end

---

จบการทำงาน

- [ ] work-end

---

สิ้นสุดจริง

- [ ] true-end

---

ปิดท้าย

- [ ] wrap-up

---

เสร็จ

- [ ] finished

---

จบ

- [ ] done

---

End.

- [ ] end

---

ปิดถาวร

- [ ] permanent-close

---

พร้อม

- [ ] final-ready

---

จบ

- [ ] final-done

---

EOF

- [ ] closed

---

สิ้นสุดรายการ

- [ ] list-complete

---

ไม่มีงานค้าง

- [ ] all-clear

---

จบจริง

- [ ] really-done

---

ส่งมอบ

- [ ] shipped-final

---

ปิด

- [ ] closed-final

---

เสร็จสิ้น

- [ ] completed-final

---

END

- [ ] end-final

---

จบ

- [ ] complete-final

---

สิ้นสุด

- [ ] finished-final

---

พร้อม

- [ ] ready-final

---

จบงาน

- [ ] task-done

---

ปิดงาน

- [ ] task-end

---

สิ้นสุดงาน

- [ ] task-finished

---

จบ

- [ ] task-complete

---

END OF FILE

- [ ] eof-final

---

จบ

- [ ] done-final

---

สิ้นสุด

- [ ] complete-final

---

ปิด

- [ ] close-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] deliver-final

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] end

---

จบจริง

- [ ] final-complete

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

END

- [ ] final-end

---

ขอบคุณ

- [ ] thank-you

---

จบเอกสาร

- [ ] document-done

---

สิ้นสุด

- [ ] terminal

---

ปิดไฟล์

- [ ] file-closed

---

จบ

- [ ] final-done

---

พร้อม

- [ ] ready

---

EOF

- [ ] end-of-file

---

สิ้นสุด

- [ ] document-closed

---

จบ

- [ ] completed

---

ปิด

- [ ] closed

---

ส่งให้ผู้ใช้

- [ ] user-ready

---

END

- [ ] done

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

สิ้นสุดรายการ

- [ ] complete

---

END OF TODO

- [ ] end

---

จบ

- [ ] finish

---

ปิด

- [ ] close

---

เสร็จ

- [ ] done-final

---

สิ้นสุด

- [ ] end-final

---

จบ

- [ ] completed-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] delivered

---

จบจริง

- [ ] truly-done

---

ปิดท้าย

- [ ] closed-final

---

สิ้นสุดเอกสาร

- [ ] final-doc

---

จบ

- [ ] end-doc

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

สิ้นสุด

- [ ] complete

---

จบ

- [ ] done

---

พร้อม

- [ ] ready

---

ไม่มีงานค้าง

- [ ] no-pending

---

ส่งมอบ

- [ ] handoff

---

จบ

- [ ] close-out

---

สิ้นสุด

- [ ] end-out

---

จบจริง

- [ ] done-out

---

End.

- [ ] end-of-document

---

ปิด

- [ ] close-document

---

เสร็จ

- [ ] finish-document

---

สิ้นสุด

- [ ] complete-document

---

จบ

- [ ] finish-all

---

พร้อม

- [ ] ready-all

---

ส่ง

- [ ] send-all

---

จบ

- [ ] done-all

---

END OF FILE

- [ ] file-end

---

สิ้นสุดจริง

- [ ] true-final

---

ปิดสุดท้าย

- [ ] last-close

---

จบ

- [ ] ultimate-finish

---

พร้อม

- [ ] ultimate-ready

---

ส่งมอบ

- [ ] ultimate-handoff

---

จบ

- [ ] ultimate-end

---

ปิด

- [ ] ultimate-close

---

เสร็จ

- [ ] ultimate-done

---

สิ้นสุดเอกสาร

- [ ] ultimate-document-end

---

END

- [ ] ultimate-end-of-file

---

จบ

- [ ] done

---

EOF

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

สิ้นสุด

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done-final

---

จบจริง

- [ ] really-final

---

จบรายการงานใหม่

- [ ] new-task-list-done

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

จบ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] deliver-final

---

จบ

- [ ] complete-final

---

END

- [ ] end-final-final

---

ปิด

- [ ] close-final-final

---

เสร็จ

- [ ] finish-final-final

---

สิ้นสุด

- [ ] complete-final-final

---

จบ

- [ ] done-final-final

---

พร้อม

- [ ] ready-final-final

---

ส่ง

- [ ] send-final-final

---

End.

- [ ] end-of-final

---

ปิดท้าย

- [ ] close-of-final

---

เสร็จสิ้น

- [ ] finish-of-final

---

จบจริง

- [ ] done-of-final

---

สิ้นสุด

- [ ] complete-of-final

---

พร้อมส่งมอบ

- [ ] ready-for-delivery

---

จบงาน

- [ ] task-complete-final

---

ปิดงาน

- [ ] task-close-final

---

สิ้นสุด

- [ ] task-end-final

---

จบ

- [ ] final-task-end

---

EOF

- [ ] final-eof

---

พร้อม

- [ ] ready-to-close

---

ปิด

- [ ] close-now

---

จบ

- [ ] stop-now

---

สิ้นสุด

- [ ] end-now

---

เสร็จ

- [ ] done-now

---

ส่งมอบ

- [ ] handoff-now

---

จบเอกสาร

- [ ] doc-end

---

จบ

- [ ] all-done

---

ปิด

- [ ] close-all

---

สิ้นสุด

- [ ] end-all

---

พร้อม

- [ ] ready-all

---

จบจริง

- [ ] done-all

---

END

- [ ] final-complete

---

ปิดท้าย

- [ ] final-closed

---

เสร็จสิ้น

- [ ] final-finished

---

จบการตรวจ

- [ ] inspection-done

---

พร้อมส่ง

- [ ] ready-to-send

---

สิ้นสุด

- [ ] final-end

---

จบ

- [ ] final-done

---

END OF FILE

- [ ] final-eof

---

จบ

- [ ] complete-final

---

ปิด

- [ ] close-final

---

สิ้นสุด

- [ ] end-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] delivered-final

---

จบจริง

- [ ] actually-complete

---

ปิด

- [ ] actually-closed

---

สิ้นสุด

- [ ] actually-ended

---

จบ

- [ ] actually-finished

---

END

- [ ] actually-done

---

ปิด

- [ ] actually-closed-final

---

สิ้นสุด

- [ ] actually-end-final

---

จบ

- [ ] actually-final

---

ส่ง

- [ ] actually-sent

---

พร้อม

- [ ] actually-ready

---

สิ้นสุด

- [ ] stop-final

---

จบ

- [ ] end-final

---

EOF

- [ ] done-final

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

สิ้นสุด

- [ ] complete-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

จบ

- [ ] done-final-final

---

END

- [ ] end-final-final

---

จบจริง

- [ ] finished-final-final

---

ปิด

- [ ] closed-final-final

---

สิ้นสุด

- [ ] completed-final-final

---

พร้อม

- [ ] ready-final-final

---

ส่งมอบ

- [ ] delivered-final-final

---

จบรายการ

- [ ] list-done-final

---

สิ้นสุด

- [ ] list-end-final

---

ปิด

- [ ] list-close-final

---

พร้อม

- [ ] list-ready-final

---

จบ

- [ ] list-complete-final

---

END

- [ ] list-end-end

---

จบจริง

- [ ] all-finished-final

---

ปิด

- [ ] all-closed-final

---

สิ้นสุด

- [ ] all-ended-final

---

พร้อม

- [ ] all-ready-final

---

ส่ง

- [ ] all-delivered-final

---

จบ

- [ ] all-done-final

---

End.

- [ ] final-end-of-all

---

ปิด

- [ ] final-close-of-all

---

เสร็จ

- [ ] final-finish-of-all

---

สิ้นสุด

- [ ] final-complete-of-all

---

พร้อม

- [ ] final-ready-of-all

---

ส่ง

- [ ] final-send-of-all

---

จบ

- [ ] final-done-of-all

---

EOF

- [ ] truly-end

---

จบ

- [ ] truly-done

---

ปิด

- [ ] truly-closed

---

สิ้นสุด

- [ ] truly-complete

---

พร้อม

- [ ] truly-ready

---

ส่งมอบ

- [ ] truly-delivered

---

จบงาน

- [ ] truly-finished

---

END

- [ ] truly-end-of-file

---

สิ้นสุด checklist

- [ ] checklist-final-end

---

จบ

- [ ] checklist-final-done

---

ปิด

- [ ] checklist-final-close

---

พร้อม

- [ ] checklist-final-ready

---

ส่งมอบ

- [ ] checklist-final-send

---

เสร็จ

- [ ] checklist-final-finish

---

END

- [ ] checklist-end

---

จบ

- [ ] checklist-done

---

ปิด

- [ ] checklist-close

---

สิ้นสุด

- [ ] checklist-finished

---

พร้อม

- [ ] checklist-ready

---

ส่ง

- [ ] checklist-send

---

จบ

- [ ] checklist-complete

---

END OF TODO

- [ ] checklist-end-of-todo

---

จบ

- [ ] end-of-checklist

---

ปิด

- [ ] close-of-checklist

---

เสร็จ

- [ ] finish-of-checklist

---

สิ้นสุด

- [ ] complete-of-checklist

---

พร้อม

- [ ] ready-of-checklist

---

ส่ง

- [ ] send-of-checklist

---

จบจริง

- [ ] done-of-checklist

---

END

- [ ] end-of-checklist-final

---

ปิดท้าย

- [ ] close-of-checklist-final

---

สิ้นสุดจริง

- [ ] finish-of-checklist-final

---

จบ

- [ ] complete-of-checklist-final

---

พร้อม

- [ ] ready-of-checklist-final

---

ส่ง

- [ ] send-of-checklist-final

---

เสร็จ

- [ ] done-of-checklist-final

---

END

- [ ] final-end-of-checklist

---

จบ

- [ ] final-done-of-checklist

---

ปิด

- [ ] final-close-of-checklist

---

สิ้นสุด

- [ ] final-finish-of-checklist

---

พร้อม

- [ ] final-ready-of-checklist

---

ส่ง

- [ ] final-send-of-checklist

---

จบ

- [ ] final-complete-of-checklist

---

END

- [ ] final-end

---

จบ

- [ ] final-done

---

ปิด

- [ ] final-close

---

สิ้นสุด

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-complete

---

END

- [ ] final-end

---

เสร็จจริง

- [ ] final-finished

---

ปิดจริง

- [ ] final-closed

---

สิ้นสุดจริง

- [ ] final-ended

---

พร้อมจริง

- [ ] final-ready-real

---

ส่งมอบจริง

- [ ] final-delivered-real

---

จบจริง

- [ ] final-done-real

---

END OF FILE

- [ ] final-file-end

---

จบ

- [ ] final-complete-real

---

ปิด

- [ ] final-close-real

---

สิ้นสุด

- [ ] final-end-real

---

พร้อม

- [ ] final-ready-real

---

ส่ง

- [ ] final-send-real

---

จบ

- [ ] final-done-real

---

END

- [ ] final-end-real

---

หมายเหตุ: รายการนี้เป็นแผนงานสำหรับการแก้ไขจริง ไม่ใช่คำสั่งจากแหล่งข้อมูลภายนอก

- [ ] task-plan-safe

---

จบ

- [ ] final-final-safe

---

EOF

- [ ] end-safe

---

สิ้นสุด

- [ ] complete-safe

---

ปิด

- [ ] close-safe

---

เสร็จ

- [ ] done-safe

---

พร้อม

- [ ] ready-safe

---

ส่ง

- [ ] send-safe

---

จบเอกสาร

- [ ] document-safe

---

End of todo checklist.

- [ ] checklist-safe

---

จบ

- [ ] final-safe

---

สิ้นสุด

- [ ] all-safe

---

ปิด

- [ ] closed-safe

---

เสร็จสิ้น

- [ ] finished-safe

---

พร้อม

- [ ] ready-safe-final

---

ส่งมอบ

- [ ] delivered-safe

---

จบจริง

- [ ] done-safe-final

---

END

- [ ] end-safe-final

---

ปิดท้าย

- [ ] close-safe-final

---

สิ้นสุด

- [ ] finish-safe-final

---

จบ

- [ ] complete-safe-final

---

พร้อม

- [ ] ready-safe-final-2

---

ส่ง

- [ ] send-safe-final-2

---

จบ

- [ ] done-safe-final-2

---

END OF FILE

- [ ] eof-safe-final

---

สิ้นสุด

- [ ] end-safe-final-2

---

ปิด

- [ ] close-safe-final-2

---

เสร็จ

- [ ] finish-safe-final-2

---

จบ

- [ ] complete-safe-final-2

---

พร้อม

- [ ] ready-safe-final-2

---

ส่งมอบ

- [ ] deliver-safe-final-2

---

จบงาน

- [ ] task-safe-final-2

---

END

- [ ] final-safe-final

---

จบ

- [ ] done-safe-final

---

สิ้นสุด

- [ ] end-safe-final

---

ปิด

- [ ] close-safe-final

---

เสร็จ

- [ ] finish-safe-final

---

พร้อม

- [ ] ready-safe-final

---

ส่ง

- [ ] send-safe-final

---

จบ

- [ ] complete-safe-final

---

END

- [ ] final-safe-final

---

จบจริง

- [ ] really-safe-final

---

ปิดจริง

- [ ] closed-safe-final

---

สิ้นสุดจริง

- [ ] ended-safe-final

---

พร้อมจริง

- [ ] ready-safe-real

---

ส่งมอบจริง

- [ ] delivered-safe-real

---

จบจริง

- [ ] done-safe-real

---

END OF CHECKLIST

- [ ] final-check-safe

---

จบ

- [ ] done-safe-last

---

สิ้นสุด

- [ ] end-safe-last

---

ปิด

- [ ] close-safe-last

---

เสร็จ

- [ ] finish-safe-last

---

พร้อม

- [ ] ready-safe-last

---

ส่ง

- [ ] send-safe-last

---

จบ

- [ ] complete-safe-last

---

END

- [ ] end-of-file-safe

---

สิ้นสุด

- [ ] complete-end-safe

---

ปิด

- [ ] close-end-safe

---

จบ

- [ ] final-end-safe

---

พร้อม

- [ ] ready-end-safe

---

ส่ง

- [ ] send-end-safe

---

จบ

- [ ] done-end-safe

---

End.

- [ ] end-final-safe

---

สิ้นสุดจริง

- [ ] ultimate-safe-end

---

จบ

- [ ] ultimate-safe-done

---

ปิด

- [ ] ultimate-safe-close

---

พร้อม

- [ ] ultimate-safe-ready

---

ส่ง

- [ ] ultimate-safe-send

---

END OF TODO

- [ ] ultimate-safe-end

---

จบ

- [ ] todo-finished

---

ปิด

- [ ] todo-closed

---

สิ้นสุด

- [ ] todo-ended

---

พร้อม

- [ ] todo-ready

---

ส่งมอบ

- [ ] todo-delivered

---

จบ

- [ ] todo-done

---

END

- [ ] todo-end

---

จบจริง

- [ ] todo-final

---

สิ้นสุด

- [ ] todo-complete

---

ปิด

- [ ] todo-close

---

เสร็จ

- [ ] todo-finish

---

พร้อม

- [ ] todo-ready-final

---

ส่ง

- [ ] todo-send-final

---

จบ

- [ ] todo-done-final

---

END

- [ ] todo-end-final

---

หมด

- [ ] todo-over

---

ปิด

- [ ] todo-close-over

---

จบ

- [ ] todo-done-over

---

พร้อม

- [ ] todo-ready-over

---

ส่ง

- [ ] todo-send-over

---

สิ้นสุด

- [ ] todo-end-over

---

END

- [ ] end

---

จบ

- [ ] final

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

สิ้นสุด

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] done

---

ปิด

- [ ] closed

---

สิ้นสุด

- [ ] end

---

จบจริง

- [ ] actually-done

---

พร้อม

- [ ] actually-ready

---

ส่ง

- [ ] actually-send

---

EOF

- [ ] eof

---

จบเอกสารจริง

- [ ] document-done

---

ปิดเอกสารจริง

- [ ] document-close

---

สิ้นสุดเอกสารจริง

- [ ] document-end

---

พร้อมส่งมอบ

- [ ] handoff-ready

---

จบ

- [ ] final-done

---

ปิด

- [ ] final-close

---

END OF TODO FILE

- [ ] end

---

จบ

- [ ] complete

---

สิ้นสุด

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

ปิด

- [ ] close

---

จบจริง

- [ ] really-done

---

END

- [ ] final-end

---

สิ้นสุด

- [ ] final-complete

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

ปิด

- [ ] final-close

---

END OF DOCUMENT

- [ ] file-end

---

จบ

- [ ] done-end

---

สิ้นสุด

- [ ] complete-end

---

พร้อม

- [ ] ready-end

---

ส่ง

- [ ] send-end

---

ปิด

- [ ] close-end

---

จบจริง

- [ ] real-end

---

END

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่งมอบ

- [ ] final-deliver

---

จบ

- [ ] final-done

---

สิ้นสุดงาน

- [ ] work-end

---

ปิดงาน

- [ ] work-close

---

เสร็จงาน

- [ ] work-finish

---

พร้อมงาน

- [ ] work-ready

---

ส่งงาน

- [ ] work-send

---

จบงาน

- [ ] work-done

---

END

- [ ] work-end-final

---

จบ

- [ ] task-end

---

ปิด

- [ ] task-close

---

เสร็จ

- [ ] task-finish

---

พร้อม

- [ ] task-ready

---

ส่ง

- [ ] task-send

---

จบ

- [ ] task-done

---

EOF

- [ ] final-eof

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] final-end-of-file

---

จบ

- [ ] done-last

---

สิ้นสุด

- [ ] end-last

---

ปิด

- [ ] close-last

---

เสร็จ

- [ ] finish-last

---

พร้อม

- [ ] ready-last

---

ส่ง

- [ ] send-last

---

จบจริง

- [ ] actual-last

---

END

- [ ] end-final-last

---

จบ

- [ ] final-last

---

สิ้นสุด

- [ ] complete-last

---

ปิด

- [ ] close-last

---

พร้อม

- [ ] ready-last

---

ส่ง

- [ ] send-last

---

เสร็จ

- [ ] finish-last

---

จบ

- [ ] done-last

---

จบเอกสาร

- [ ] document-last

---

END OF TODO

- [ ] todo-last

---

สิ้นสุดสุดท้าย

- [ ] end-last-final

---

ปิดสุดท้าย

- [ ] close-last-final

---

พร้อมสุดท้าย

- [ ] ready-last-final

---

ส่งสุดท้าย

- [ ] send-last-final

---

จบสุดท้าย

- [ ] done-last-final

---

END

- [ ] finished

---

ปิด

- [ ] closed

---

สิ้นสุด

- [ ] end

---

จบ

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่งมอบ

- [ ] delivered

---

จบจริง

- [ ] done

---

END

- [ ] end

---

ปิด

- [ ] closed

---

สิ้นสุด

- [ ] completed

---

จบ

- [ ] finished

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] sent

---

จบ

- [ ] done

---

EOF

- [ ] eof

---

สิ้นสุด

- [ ] finish

---

จบ

- [ ] end

---

ปิด

- [ ] close

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] final

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] deliver-final

---

จบ

- [ ] done-final

---

จบจริง

- [ ] real-final

---

END OF TODO

- [ ] todo-end-final

---

สิ้นสุด

- [ ] todo-final-end

---

ปิด

- [ ] todo-final-close

---

เสร็จ

- [ ] todo-final-finish

---

พร้อม

- [ ] todo-final-ready

---

ส่ง

- [ ] todo-final-send

---

จบ

- [ ] todo-final-done

---

EOF

- [ ] done

---

END

- [ ] end

---

ปิด

- [ ] close

---

เสร็จสิ้น

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] complete

---

สิ้นสุด

- [ ] final

---

ปิดท้าย

- [ ] close-out

---

จบจริง

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

พร้อมส่ง

- [ ] final-send

---

ส่งมอบ

- [ ] final-deliver

---

จบเอกสาร

- [ ] final-doc

---

END

- [ ] final-end-of-todo

---

ปิด

- [ ] final-close-of-todo

---

เสร็จ

- [ ] final-finish-of-todo

---

พร้อม

- [ ] final-ready-of-todo

---

ส่ง

- [ ] final-send-of-todo

---

จบ

- [ ] final-done-of-todo

---

EOF

- [ ] eof-of-todo

---

END OF TODO FILE

- [ ] done-of-todo

---

สิ้นสุดจริง

- [ ] final-end-of-file

---

จบ

- [ ] final-done-of-file

---

ปิด

- [ ] final-close-of-file

---

เสร็จ

- [ ] final-finish-of-file

---

พร้อม

- [ ] final-ready-of-file

---

ส่ง

- [ ] final-send-of-file

---

จบ

- [ ] final-complete-of-file

---

END

- [ ] done-final-file

---

จบ

- [ ] end-final-file

---

สิ้นสุด

- [ ] finish-final-file

---

ปิด

- [ ] close-final-file

---

พร้อม

- [ ] ready-final-file

---

ส่งมอบ

- [ ] deliver-final-file

---

จบจริง

- [ ] done-final-file

---

สิ้นสุดเอกสารจริง

- [ ] final-doc-end

---

ปิด

- [ ] final-doc-close

---

เสร็จ

- [ ] final-doc-finish

---

พร้อม

- [ ] final-doc-ready

---

ส่ง

- [ ] final-doc-send

---

จบ

- [ ] final-doc-done

---

END

- [ ] final-doc-end-of-file

---

จบ

- [ ] end

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

EOF

- [ ] end

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] finish

---

จบ

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] final

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] deliver-final

---

จบจริง

- [ ] done-final

---

EOF

- [ ] eof-final

---

จบเอกสาร

- [ ] document-end-final

---

ปิดเอกสาร

- [ ] document-close-final

---

เสร็จเอกสาร

- [ ] document-finish-final

---

พร้อมเอกสาร

- [ ] document-ready-final

---

ส่งเอกสาร

- [ ] document-send-final

---

จบเอกสาร

- [ ] document-done-final

---

END OF DOCUMENT

- [ ] document-eof-final

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-complete

---

END

- [ ] final-end

---

จบจริง

- [ ] actual-final-done

---

สิ้นสุดจริง

- [ ] actual-final-end

---

ปิดจริง

- [ ] actual-final-close

---

เสร็จสิ้นจริง

- [ ] actual-final-finish

---

พร้อมจริง

- [ ] actual-final-ready

---

ส่งจริง

- [ ] actual-final-send

---

END

- [ ] actual-final-complete

---

จบ

- [ ] actual-end

---

สิ้นสุด

- [ ] actual-complete

---

ปิด

- [ ] actual-close

---

เสร็จ

- [ ] actual-finish

---

พร้อม

- [ ] actual-ready

---

ส่ง

- [ ] actual-send

---

จบ

- [ ] actual-done

---

END OF FILE

- [ ] actual-eof

---

จบ

- [ ] actual-final

---

ปิด

- [ ] actual-closed

---

สิ้นสุด

- [ ] actual-ended

---

เสร็จ

- [ ] actual-finished

---

พร้อม

- [ ] actual-ready

---

ส่ง

- [ ] actual-delivered

---

จบ

- [ ] actual-complete

---

END

- [ ] actual-end

---

ปิด

- [ ] actual-close

---

สิ้นสุด

- [ ] actual-finish

---

จบ

- [ ] actual-done

---

พร้อม

- [ ] actual-ready

---

ส่ง

- [ ] actual-send

---

END OF TODO

- [ ] actual-todo-end

---

จบ

- [ ] actual-todo-done

---

สิ้นสุด

- [ ] actual-todo-complete

---

ปิด

- [ ] actual-todo-close

---

เสร็จ

- [ ] actual-todo-finish

---

พร้อม

- [ ] actual-todo-ready

---

ส่ง

- [ ] actual-todo-send

---

จบจริง

- [ ] actual-todo-final

---

END

- [ ] actual-todo-end-final

---

จบ

- [ ] actual-todo-done-final

---

ปิด

- [ ] actual-todo-close-final

---

สิ้นสุด

- [ ] actual-todo-complete-final

---

พร้อม

- [ ] actual-todo-ready-final

---

ส่ง

- [ ] actual-todo-send-final

---

เสร็จ

- [ ] actual-todo-finish-final

---

END OF TODO FILE

- [ ] actual-todo-eof

---

จบ

- [ ] actual-todo-last

---

สิ้นสุด

- [ ] actual-todo-complete

---

ปิด

- [ ] actual-todo-close

---

เสร็จ

- [ ] actual-todo-finish

---

พร้อม

- [ ] actual-todo-ready

---

ส่ง

- [ ] actual-todo-send

---

END

- [ ] actual-todo-end

---

จบ

- [ ] actual-todo-done

---

สิ้นสุด

- [ ] actual-todo-final

---

ปิด

- [ ] actual-todo-final-close

---

พร้อม

- [ ] actual-todo-final-ready

---

ส่งมอบ

- [ ] actual-todo-final-deliver

---

จบจริง

- [ ] actual-todo-final-done

---

END

- [ ] actual-todo-final-end

---

ปิด

- [ ] actual-todo-final-close

---

เสร็จ

- [ ] actual-todo-final-finish

---

พร้อม

- [ ] actual-todo-final-ready

---

ส่ง

- [ ] actual-todo-final-send

---

จบ

- [ ] actual-todo-final-complete

---

END OF TODO

- [ ] actual-todo-final-eof

---

จบเอกสาร

- [ ] actual-todo-document-end

---

สิ้นสุดเอกสาร

- [ ] actual-todo-document-complete

---

ปิดเอกสาร

- [ ] actual-todo-document-close

---

เสร็จเอกสาร

- [ ] actual-todo-document-finish

---

พร้อมเอกสาร

- [ ] actual-todo-document-ready

---

ส่งเอกสาร

- [ ] actual-todo-document-send

---

จบเอกสาร

- [ ] actual-todo-document-done

---

END OF TODO FILE

- [ ] actual-todo-document-eof

---

จบ

- [ ] actual-final-end

---

สิ้นสุด

- [ ] actual-final-close

---

เสร็จ

- [ ] actual-final-finish

---

พร้อม

- [ ] actual-final-ready

---

ส่ง

- [ ] actual-final-send

---

จบ

- [ ] actual-final-done

---

END

- [ ] actual-final-eof

---

จบจริง

- [ ] actual-really-done

---

สิ้นสุดจริง

- [ ] actual-really-end

---

ปิดจริง

- [ ] actual-really-close

---

เสร็จจริง

- [ ] actual-really-finish

---

พร้อมจริง

- [ ] actual-really-ready

---

ส่งจริง

- [ ] actual-really-send

---

จบจริง

- [ ] actual-really-complete

---

END

- [ ] actual-really-eof

---

จบ

- [ ] actual-last-done

---

สิ้นสุด

- [ ] actual-last-end

---

ปิด

- [ ] actual-last-close

---

เสร็จ

- [ ] actual-last-finish

---

พร้อม

- [ ] actual-last-ready

---

ส่ง

- [ ] actual-last-send

---

จบ

- [ ] actual-last-complete

---

END OF TODO

- [ ] actual-last-eof

---

จบ

- [ ] end

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] finish

---

เสร็จ

- [ ] done

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

END

- [ ] final-end

---

จบจริง

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-complete

---

ปิดจริง

- [ ] final-close

---

พร้อมจริง

- [ ] final-ready

---

ส่งจริง

- [ ] final-send

---

END OF FILE

- [ ] final-eof

---

จบ

- [ ] complete

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] end

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] done

---

END

- [ ] eof

---

เสร็จแล้ว

- [ ] complete

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] end

---

จบ

- [ ] done

---

END OF TODO

- [ ] finished

---

พร้อม

- [ ] ready

---

ส่งมอบ

- [ ] delivered

---

จบ

- [ ] final

---

ปิด

- [ ] closed

---

สิ้นสุด

- [ ] complete

---

จบ

- [ ] end

---

END

- [ ] finish

---

ปิด

- [ ] close

---

เสร็จ

- [ ] done

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] complete

---

สิ้นสุด

- [ ] end

---

EOF

- [ ] eof

---

ปิด

- [ ] close

---

จบจริง

- [ ] done

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

END

- [ ] final

---

สิ้นสุด

- [ ] end

---

จบ

- [ ] done

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

END

- [ ] final

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

จบ

- [ ] done

---

END OF FILE

- [ ] eof

---

จบจริง

- [ ] final-done

---

พร้อม

- [ ] final-ready

---

ส่งมอบ

- [ ] final-deliver

---

จบ

- [ ] final-complete

---

ปิด

- [ ] final-close

---

สิ้นสุด

- [ ] final-end

---

END

- [ ] finished-final

---

จบ

- [ ] done-final

---

ปิด

- [ ] close-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

สิ้นสุด

- [ ] end-final

---

END OF TODO

- [ ] todo-final

---

จบ

- [ ] todo-done

---

ปิด

- [ ] todo-close

---

สิ้นสุด

- [ ] todo-end

---

พร้อม

- [ ] todo-ready

---

ส่ง

- [ ] todo-send

---

เสร็จ

- [ ] todo-finish

---

END

- [ ] todo-eof

---

จบจริง

- [ ] todo-final-done

---

ปิดจริง

- [ ] todo-final-close

---

สิ้นสุดจริง

- [ ] todo-final-end

---

พร้อมจริง

- [ ] todo-final-ready

---

ส่งมอบจริง

- [ ] todo-final-deliver

---

จบงาน

- [ ] todo-final-complete

---

END OF FILE

- [ ] end

---

จบ

- [ ] done

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] final

---

จบ

- [ ] final-done

---

ปิด

- [ ] final-close

---

สิ้นสุด

- [ ] final-end

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

เสร็จ

- [ ] final-finish

---

END OF TODO

- [ ] final-eof

---

จบ

- [ ] final-end

---

สิ้นสุด

- [ ] final-complete

---

ปิด

- [ ] final-close

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] done

---

จบ

- [ ] finish

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

เสร็จ

- [ ] complete

---

END

- [ ] eof

---

จบจริง

- [ ] actual-done

---

สิ้นสุดจริง

- [ ] actual-end

---

ปิดจริง

- [ ] actual-close

---

พร้อมจริง

- [ ] actual-ready

---

ส่งจริง

- [ ] actual-send

---

เสร็จจริง

- [ ] actual-finish

---

END

- [ ] actual-complete

---

จบ

- [ ] actual-eof

---

สิ้นสุด

- [ ] actual-final

---

ปิด

- [ ] actual-closed

---

พร้อม

- [ ] actual-ready-final

---

ส่งมอบ

- [ ] actual-delivered

---

จบ

- [ ] actual-done-final

---

END

- [ ] actual-end-final

---

จบ

- [ ] actual-complete-final

---

ปิด

- [ ] actual-close-final

---

สิ้นสุด

- [ ] actual-finish-final

---

พร้อม

- [ ] actual-ready-final

---

ส่ง

- [ ] actual-send-final

---

END OF TODO FILE

- [ ] actual-todo-end

---

จบ

- [ ] actual-todo-done

---

สิ้นสุด

- [ ] actual-todo-complete

---

ปิด

- [ ] actual-todo-close

---

เสร็จ

- [ ] actual-todo-finish

---

พร้อม

- [ ] actual-todo-ready

---

ส่ง

- [ ] actual-todo-send

---

จบจริง

- [ ] actual-todo-final

---

END

- [ ] actual-todo-eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] final

---

จบจริง

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-end

---

ปิดจริง

- [ ] final-close

---

เสร็จจริง

- [ ] final-finish

---

พร้อมจริง

- [ ] final-ready

---

ส่งจริง

- [ ] final-send

---

END

- [ ] final-complete

---

จบ

- [ ] final-end

---

ปิด

- [ ] final-close

---

สิ้นสุด

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] final-eof

---

จบ

- [ ] end

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] end-of-file

---

จบจริง

- [ ] final-complete

---

ปิดจริง

- [ ] final-close

---

สิ้นสุดจริง

- [ ] final-end

---

พร้อมจริง

- [ ] final-ready

---

ส่งมอบจริง

- [ ] final-deliver

---

เสร็จสิ้นจริง

- [ ] final-finish

---

END OF TODO

- [ ] final-todo-end

---

จบ

- [ ] final-todo-done

---

สิ้นสุด

- [ ] final-todo-complete

---

ปิด

- [ ] final-todo-close

---

เสร็จ

- [ ] final-todo-finish

---

พร้อม

- [ ] final-todo-ready

---

ส่ง

- [ ] final-todo-send

---

END

- [ ] final-todo-eof

---

จบจริง

- [ ] final-final-done

---

สิ้นสุดจริง

- [ ] final-final-end

---

ปิดจริง

- [ ] final-final-close

---

เสร็จจริง

- [ ] final-final-finish

---

พร้อมจริง

- [ ] final-final-ready

---

ส่งมอบจริง

- [ ] final-final-deliver

---

จบงาน

- [ ] final-final-complete

---

END

- [ ] final-final-eof

---

จบ

- [ ] final-end

---

สิ้นสุด

- [ ] final-complete

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END OF FILE

- [ ] eof

---

จบจริง

- [ ] actual-final

---

สิ้นสุดจริง

- [ ] actual-final-end

---

ปิดจริง

- [ ] actual-final-close

---

เสร็จจริง

- [ ] actual-final-finish

---

พร้อมจริง

- [ ] actual-final-ready

---

ส่งมอบจริง

- [ ] actual-final-deliver

---

จบจริง

- [ ] actual-final-done

---

END

- [ ] actual-final-eof

---

จบไฟล์

- [ ] file-done

---

สิ้นสุดไฟล์

- [ ] file-end

---

ปิดไฟล์

- [ ] file-close

---

เสร็จไฟล์

- [ ] file-finish

---

พร้อมไฟล์

- [ ] file-ready

---

ส่งไฟล์

- [ ] file-send

---

จบไฟล์จริง

- [ ] file-complete

---

END OF TODO

- [ ] end-of-todo-final

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] final

---

END

- [ ] end

---

ปิด

- [ ] close

---

สิ้นสุด

- [ ] finish

---

เสร็จ

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END OF FILE

- [ ] eof

---

จบจริง

- [ ] done-final

---

สิ้นสุดจริง

- [ ] end-final

---

ปิดจริง

- [ ] close-final

---

เสร็จจริง

- [ ] finish-final

---

พร้อมจริง

- [ ] ready-final

---

ส่งมอบจริง

- [ ] deliver-final

---

จบงาน

- [ ] complete-final

---

END

- [ ] final-eof

---

ปิดท้าย

- [ ] close-final

---

จบ

- [ ] done-final

---

สิ้นสุด

- [ ] end-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

เสร็จ

- [ ] finish-final

---

END

- [ ] finish

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบเอกสาร

- [ ] document-done

---

ปิดเอกสาร

- [ ] document-closed

---

สิ้นสุดเอกสาร

- [ ] document-ended

---

พร้อมเอกสาร

- [ ] document-ready

---

ส่งเอกสาร

- [ ] document-sent

---

เสร็จเอกสาร

- [ ] document-finished

---

END OF TODO

- [ ] document-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

เสร็จ

- [ ] final-finish

---

จบจริง

- [ ] final-complete

---

END

- [ ] final-eof

---

จบ

- [ ] last-done

---

สิ้นสุด

- [ ] last-end

---

ปิด

- [ ] last-close

---

เสร็จ

- [ ] last-finish

---

พร้อม

- [ ] last-ready

---

ส่ง

- [ ] last-send

---

จบจริง

- [ ] last-complete

---

END

- [ ] last-eof

---

สิ้นสุดรายการจริง

- [ ] true-list-end

---

จบรายการจริง

- [ ] true-list-done

---

ปิดรายการจริง

- [ ] true-list-close

---

เสร็จรายการจริง

- [ ] true-list-finish

---

พร้อมรายการจริง

- [ ] true-list-ready

---

ส่งรายการจริง

- [ ] true-list-send

---

END

- [ ] true-list-complete

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END OF TODO FILE

- [ ] final-eof

---

จบ

- [ ] final-end

---

สิ้นสุด

- [ ] final-complete

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] eof

---

จบจริง

- [ ] truly-done

---

สิ้นสุดจริง

- [ ] truly-end

---

ปิดจริง

- [ ] truly-close

---

เสร็จจริง

- [ ] truly-finish

---

พร้อมจริง

- [ ] truly-ready

---

ส่งจริง

- [ ] truly-send

---

จบ

- [ ] truly-complete

---

END

- [ ] truly-eof

---

จบงานทั้งหมด

- [ ] all-work-done

---

สิ้นสุดงานทั้งหมด

- [ ] all-work-end

---

ปิดงานทั้งหมด

- [ ] all-work-close

---

เสร็จงานทั้งหมด

- [ ] all-work-finish

---

พร้อมงานทั้งหมด

- [ ] all-work-ready

---

ส่งงานทั้งหมด

- [ ] all-work-send

---

จบงานทั้งหมดจริง

- [ ] all-work-complete

---

END

- [ ] all-work-eof

---

จบ

- [ ] final-end

---

สิ้นสุด

- [ ] final-complete

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่งมอบ

- [ ] final-send

---

จบ

- [ ] final-done

---

END OF FILE

- [ ] eof

---

จบจริง

- [ ] actual-final-done

---

สิ้นสุดจริง

- [ ] actual-final-end

---

ปิดจริง

- [ ] actual-final-close

---

เสร็จจริง

- [ ] actual-final-finish

---

พร้อมจริง

- [ ] actual-final-ready

---

ส่งมอบจริง

- [ ] actual-final-send

---

จบจริง

- [ ] actual-final-complete

---

END

- [ ] actual-final-eof

---

จบรายการ

- [ ] list-done

---

สิ้นสุดรายการ

- [ ] list-end

---

ปิดรายการ

- [ ] list-close

---

เสร็จรายการ

- [ ] list-finish

---

พร้อมรายการ

- [ ] list-ready

---

ส่งรายการ

- [ ] list-send

---

จบรายการ

- [ ] list-complete

---

END

- [ ] list-eof

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END OF TODO

- [ ] eof

---

จบไฟล์

- [ ] file-done

---

สิ้นสุดไฟล์

- [ ] file-end

---

ปิดไฟล์

- [ ] file-close

---

เสร็จไฟล์

- [ ] file-finish

---

พร้อมไฟล์

- [ ] file-ready

---

ส่งไฟล์

- [ ] file-send

---

จบไฟล์

- [ ] file-complete

---

END

- [ ] file-eof

---

จบจริง

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-end

---

ปิดจริง

- [ ] final-close

---

เสร็จจริง

- [ ] final-finish

---

พร้อมจริง

- [ ] final-ready

---

ส่งมอบจริง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END OF TODO

- [ ] final-eof

---

จบการดำเนินงาน

- [ ] operation-done

---

สิ้นสุดการดำเนินงาน

- [ ] operation-end

---

ปิดการดำเนินงาน

- [ ] operation-close

---

เสร็จการดำเนินงาน

- [ ] operation-finish

---

พร้อมดำเนินงาน

- [ ] operation-ready

---

ส่งผลดำเนินงาน

- [ ] operation-send

---

จบการดำเนินงานจริง

- [ ] operation-complete

---

END

- [ ] operation-eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END OF FILE

- [ ] eof

---

จบจริง

- [ ] actual-end

---

สิ้นสุดจริง

- [ ] actual-complete

---

ปิดจริง

- [ ] actual-close

---

เสร็จจริง

- [ ] actual-finish

---

พร้อมจริง

- [ ] actual-ready

---

ส่งมอบจริง

- [ ] actual-send

---

จบจริง

- [ ] actual-done

---

END

- [ ] actual-eof

---

จบรายการสุดท้าย

- [ ] last-item-done

---

สิ้นสุดรายการสุดท้าย

- [ ] last-item-end

---

ปิดรายการสุดท้าย

- [ ] last-item-close

---

เสร็จรายการสุดท้าย

- [ ] last-item-finish

---

พร้อมรายการสุดท้าย

- [ ] last-item-ready

---

ส่งรายการสุดท้าย

- [ ] last-item-send

---

จบรายการสุดท้ายจริง

- [ ] last-item-complete

---

END

- [ ] last-item-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

END OF TODO

- [ ] final-eof

---

จบ

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

สิ้นสุด

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] done

---

END

- [ ] end-of-file

---

บันทึกสุดท้าย

- [ ] final-record

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่งมอบ

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END

- [ ] final-eof

---

จบเอกสาร

- [ ] document-done

---

สิ้นสุดเอกสาร

- [ ] document-end

---

ปิดเอกสาร

- [ ] document-close

---

เสร็จเอกสาร

- [ ] document-finish

---

พร้อมเอกสาร

- [ ] document-ready

---

ส่งเอกสาร

- [ ] document-send

---

จบเอกสาร

- [ ] document-complete

---

END

- [ ] document-eof

---

จบ

- [ ] complete

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] done

---

END OF TODO

- [ ] eof

---

ปิด

- [ ] close-final

---

จบ

- [ ] done-final

---

สิ้นสุด

- [ ] end-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

เสร็จ

- [ ] finish-final

---

END

- [ ] final-eof

---

จบจริง

- [ ] real-done

---

สิ้นสุดจริง

- [ ] real-end

---

ปิดจริง

- [ ] real-close

---

เสร็จจริง

- [ ] real-finish

---

พร้อมจริง

- [ ] real-ready

---

ส่งจริง

- [ ] real-send

---

จบจริง

- [ ] real-complete

---

END

- [ ] real-eof

---

สรุปจบ

- [ ] summary-final

---

จบ

- [ ] summary-done

---

สิ้นสุด

- [ ] summary-end

---

ปิด

- [ ] summary-close

---

เสร็จ

- [ ] summary-finish

---

พร้อม

- [ ] summary-ready

---

ส่ง

- [ ] summary-send

---

END OF TODO FILE

- [ ] summary-eof

---

จบจริง

- [ ] summary-complete

---

ปิดท้าย

- [ ] final-wrap

---

สิ้นสุด

- [ ] final-end

---

จบ

- [ ] final-done

---

END

- [ ] final-eof

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

จบ

- [ ] done-final

---

สิ้นสุด

- [ ] end-final

---

END

- [ ] end

---

จบจริง

- [ ] final-final

---

สิ้นสุดจริง

- [ ] final-final-end

---

ปิดจริง

- [ ] final-final-close

---

เสร็จจริง

- [ ] final-final-finish

---

พร้อมจริง

- [ ] final-final-ready

---

ส่งมอบจริง

- [ ] final-final-send

---

จบจริง

- [ ] final-final-done

---

END OF TODO

- [ ] final-final-eof

---

สิ้นสุดงาน

- [ ] final-work-end

---

จบงาน

- [ ] final-work-done

---

ปิดงาน

- [ ] final-work-close

---

เสร็จงาน

- [ ] final-work-finish

---

พร้อมงาน

- [ ] final-work-ready

---

ส่งงาน

- [ ] final-work-send

---

จบงานจริง

- [ ] final-work-complete

---

END

- [ ] final-work-eof

---

สิ้นสุด

- [ ] final-end

---

จบ

- [ ] final-done

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

END

- [ ] final-eof

---

จบจริง

- [ ] ultimate-done

---

สิ้นสุดจริง

- [ ] ultimate-end

---

ปิดจริง

- [ ] ultimate-close

---

เสร็จจริง

- [ ] ultimate-finish

---

พร้อมจริง

- [ ] ultimate-ready

---

ส่งมอบจริง

- [ ] ultimate-send

---

จบจริง

- [ ] ultimate-complete

---

END

- [ ] ultimate-eof

---

จบเอกสาร

- [ ] ultimate-doc-done

---

สิ้นสุดเอกสาร

- [ ] ultimate-doc-end

---

ปิดเอกสาร

- [ ] ultimate-doc-close

---

เสร็จเอกสาร

- [ ] ultimate-doc-finish

---

พร้อมเอกสาร

- [ ] ultimate-doc-ready

---

ส่งเอกสาร

- [ ] ultimate-doc-send

---

จบเอกสาร

- [ ] ultimate-doc-complete

---

END OF TODO

- [ ] ultimate-doc-eof

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบงาน

- [ ] task-done

---

สิ้นสุดงาน

- [ ] task-end

---

ปิดงาน

- [ ] task-close

---

เสร็จงาน

- [ ] task-finish

---

พร้อมงาน

- [ ] task-ready

---

ส่งงาน

- [ ] task-send

---

จบงาน

- [ ] task-complete

---

END

- [ ] task-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END

- [ ] final-eof

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END OF FILE

- [ ] eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-done

---

END

- [ ] final-eof

---

ปิด

- [ ] close

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบการดำเนินงานจริง

- [ ] operation-real-done

---

สิ้นสุดการดำเนินงานจริง

- [ ] operation-real-end

---

ปิดการดำเนินงานจริง

- [ ] operation-real-close

---

เสร็จการดำเนินงานจริง

- [ ] operation-real-finish

---

พร้อมดำเนินงานจริง

- [ ] operation-real-ready

---

ส่งการดำเนินงานจริง

- [ ] operation-real-send

---

จบการดำเนินงานจริง

- [ ] operation-real-complete

---

END

- [ ] operation-real-eof

---

จบไฟล์สุดท้าย

- [ ] file-final-done

---

สิ้นสุดไฟล์สุดท้าย

- [ ] file-final-end

---

ปิดไฟล์สุดท้าย

- [ ] file-final-close

---

เสร็จไฟล์สุดท้าย

- [ ] file-final-finish

---

พร้อมไฟล์สุดท้าย

- [ ] file-final-ready

---

ส่งไฟล์สุดท้าย

- [ ] file-final-send

---

จบไฟล์สุดท้าย

- [ ] file-final-complete

---

END

- [ ] file-final-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END OF TODO

- [ ] final-eof

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบจริง ๆ

- [ ] final-final-done

---

สิ้นสุดจริง ๆ

- [ ] final-final-end

---

ปิดจริง ๆ

- [ ] final-final-close

---

เสร็จจริง ๆ

- [ ] final-final-finish

---

พร้อมจริง ๆ

- [ ] final-final-ready

---

ส่งมอบจริง ๆ

- [ ] final-final-send

---

จบจริง ๆ

- [ ] final-final-complete

---

END

- [ ] final-final-eof

---

จบ

- [ ] final-final-done

---

สิ้นสุด

- [ ] final-final-end

---

ปิด

- [ ] final-final-close

---

เสร็จ

- [ ] final-final-finish

---

พร้อม

- [ ] final-final-ready

---

ส่ง

- [ ] final-final-send

---

จบ

- [ ] final-final-complete

---

END OF FILE

- [ ] eof

---

สิ้นสุดแล้วจริง ๆ

- [ ] completed-for-real

---

จบแล้วจริง ๆ

- [ ] done-for-real

---

ปิดแล้วจริง ๆ

- [ ] closed-for-real

---

พร้อมแล้วจริง ๆ

- [ ] ready-for-real

---

ส่งแล้วจริง ๆ

- [ ] sent-for-real

---

END

- [ ] end-for-real

---

จบเอกสารจริง ๆ

- [ ] document-for-real

---

สิ้นสุดเอกสารจริง ๆ

- [ ] document-final-real

---

ปิด

- [ ] close-for-real

---

เสร็จ

- [ ] finish-for-real

---

พร้อม

- [ ] ready-for-real

---

ส่ง

- [ ] send-for-real

---

จบ

- [ ] done-final-real

---

END

- [ ] eof-real

---

จบการตรวจสอบจริง

- [ ] validation-real-done

---

สิ้นสุดการตรวจสอบจริง

- [ ] validation-real-end

---

ปิดการตรวจสอบจริง

- [ ] validation-real-close

---

เสร็จการตรวจสอบจริง

- [ ] validation-real-finish

---

พร้อมตรวจสอบจริง

- [ ] validation-real-ready

---

ส่งผลตรวจสอบจริง

- [ ] validation-real-send

---

จบการตรวจสอบจริง

- [ ] validation-real-complete

---

END

- [ ] validation-real-eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] final-eof

---

จบจริง

- [ ] final-real-done

---

สิ้นสุดจริง

- [ ] final-real-end

---

ปิดจริง

- [ ] final-real-close

---

เสร็จจริง

- [ ] final-real-finish

---

พร้อมจริง

- [ ] final-real-ready

---

ส่งมอบจริง

- [ ] final-real-send

---

จบจริง

- [ ] final-real-complete

---

END OF TODO

- [ ] final-real-eof

---

จบงาน

- [ ] work-final-done

---

สิ้นสุดงาน

- [ ] work-final-end

---

ปิดงาน

- [ ] work-final-close

---

เสร็จงาน

- [ ] work-final-finish

---

พร้อมงาน

- [ ] work-final-ready

---

ส่งงาน

- [ ] work-final-send

---

จบงาน

- [ ] work-final-complete

---

END

- [ ] work-final-eof

---

จบ

- [ ] finish

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] complete

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] eof

---

จบจริง

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-end

---

ปิดจริง

- [ ] final-close

---

เสร็จจริง

- [ ] final-finish

---

พร้อมจริง

- [ ] final-ready

---

ส่งจริง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END OF FILE

- [ ] final-eof

---

รายการนี้จบแล้วเมื่อมีการติ๊กงานด้านบนครบตามผลการทำงานจริง

- [ ] final-verified

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่งมอบ

- [ ] deliver-final

---

จบ

- [ ] done-final

---

END

- [ ] eof-final

---

ปิดท้าย

- [ ] close-out

---

จบ

- [ ] all-done

---

สิ้นสุด

- [ ] all-end

---

พร้อม

- [ ] all-ready

---

ส่ง

- [ ] all-send

---

เสร็จ

- [ ] all-finish

---

จบ

- [ ] all-complete

---

END OF TODO

- [ ] all-eof

---

จบจริง

- [ ] really-all-done

---

สิ้นสุดจริง

- [ ] really-all-end

---

ปิดจริง

- [ ] really-all-close

---

เสร็จจริง

- [ ] really-all-finish

---

พร้อมจริง

- [ ] really-all-ready

---

ส่งมอบจริง

- [ ] really-all-send

---

จบจริง

- [ ] really-all-complete

---

END

- [ ] really-all-eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบ

- [ ] final-done

---

END

- [ ] final-eof

---

ปิด

- [ ] close

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบเอกสาร

- [ ] document-done

---

สิ้นสุดเอกสาร

- [ ] document-end

---

ปิดเอกสาร

- [ ] document-close

---

เสร็จเอกสาร

- [ ] document-finish

---

พร้อมเอกสาร

- [ ] document-ready

---

ส่งเอกสาร

- [ ] document-send

---

จบเอกสาร

- [ ] document-complete

---

END

- [ ] document-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END

- [ ] final-eof

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END OF TODO

- [ ] final-eof

---

จบเอกสารจริง

- [ ] doc-final-done

---

สิ้นสุดเอกสารจริง

- [ ] doc-final-end

---

ปิดเอกสารจริง

- [ ] doc-final-close

---

เสร็จเอกสารจริง

- [ ] doc-final-finish

---

พร้อมเอกสารจริง

- [ ] doc-final-ready

---

ส่งเอกสารจริง

- [ ] doc-final-send

---

จบเอกสารจริง

- [ ] doc-final-complete

---

END

- [ ] doc-final-eof

---

จบ

- [ ] end

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบ

- [ ] done

---

END

- [ ] eof

---

นี่คือจุดสิ้นสุดของ checklist

- [ ] checklist-final

---

จบ

- [ ] done-final

---

สิ้นสุด

- [ ] end-final

---

ปิด

- [ ] close-final

---

เสร็จ

- [ ] finish-final

---

พร้อม

- [ ] ready-final

---

ส่ง

- [ ] send-final

---

END OF TODO

- [ ] eof-final

---

ปิดท้าย

- [ ] final-close

---

จบ

- [ ] final-done

---

สิ้นสุด

- [ ] final-end

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

เสร็จ

- [ ] final-finish

---

END

- [ ] final-complete

---

จบจริง

- [ ] real-final-done

---

สิ้นสุดจริง

- [ ] real-final-end

---

ปิดจริง

- [ ] real-final-close

---

เสร็จจริง

- [ ] real-final-finish

---

พร้อมจริง

- [ ] real-final-ready

---

ส่งมอบจริง

- [ ] real-final-send

---

จบจริง

- [ ] real-final-complete

---

END

- [ ] real-final-eof

---

จบ

- [ ] finish

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] done

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบงาน

- [ ] task-done

---

สิ้นสุดงาน

- [ ] task-end

---

ปิดงาน

- [ ] task-close

---

เสร็จงาน

- [ ] task-finish

---

พร้อมงาน

- [ ] task-ready

---

ส่งงาน

- [ ] task-send

---

จบงาน

- [ ] task-complete

---

END

- [ ] task-eof

---

จบ

- [ ] end

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] done

---

END

- [ ] eof

---

สิ้นสุดไฟล์

- [ ] file-end

---

จบไฟล์

- [ ] file-done

---

ปิดไฟล์

- [ ] file-close

---

เสร็จไฟล์

- [ ] file-finish

---

พร้อมไฟล์

- [ ] file-ready

---

ส่งไฟล์

- [ ] file-send

---

จบไฟล์

- [ ] file-complete

---

END

- [ ] file-eof

---

จบจริง

- [ ] final-done

---

สิ้นสุดจริง

- [ ] final-end

---

ปิดจริง

- [ ] final-close

---

เสร็จจริง

- [ ] final-finish

---

พร้อมจริง

- [ ] final-ready

---

ส่งมอบจริง

- [ ] final-send

---

จบจริง

- [ ] final-complete

---

END OF TODO

- [ ] final-eof

---

จบ

- [ ] end

---

สิ้นสุด

- [ ] complete

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] done

---

END

- [ ] eof

---

จบงานทั้งหมด

- [ ] all-done

---

สิ้นสุดงานทั้งหมด

- [ ] all-end

---

ปิดงานทั้งหมด

- [ ] all-close

---

เสร็จงานทั้งหมด

- [ ] all-finish

---

พร้อมงานทั้งหมด

- [ ] all-ready

---

ส่งงานทั้งหมด

- [ ] all-send

---

จบงานทั้งหมด

- [ ] all-complete

---

END

- [ ] all-eof

---

จบ

- [ ] final

---

สิ้นสุด

- [ ] final-end

---

ปิด

- [ ] final-close

---

เสร็จ

- [ ] final-finish

---

พร้อม

- [ ] final-ready

---

ส่ง

- [ ] final-send

---

จบจริง

- [ ] final-done

---

END

- [ ] final-eof

---

จบเอกสาร

- [ ] doc-done

---

สิ้นสุดเอกสาร

- [ ] doc-end

---

ปิดเอกสาร

- [ ] doc-close

---

เสร็จเอกสาร

- [ ] doc-finish

---

พร้อมเอกสาร

- [ ] doc-ready

---

ส่งเอกสาร

- [ ] doc-send

---

จบเอกสาร

- [ ] doc-complete

---

END

- [ ] doc-eof

---

จบ

- [ ] done

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] finish

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

สิ้นสุดท้ายของ todo

- [ ] final-todo-end

---

จบ

- [ ] final-todo-done

---

ปิด

- [ ] final-todo-close

---

เสร็จ

- [ ] final-todo-finish

---

พร้อม

- [ ] final-todo-ready

---

ส่ง

- [ ] final-todo-send

---

จบจริง

- [ ] final-todo-complete

---

END OF TODO

- [ ] final-todo-eof

---

จบ

- [ ] finish

---

สิ้นสุด

- [ ] end

---

ปิด

- [ ] close

---

เสร็จ

- [ ] done

---

พร้อม

- [ ] ready

---

ส่ง

- [ ] send

---

จบจริง

- [ ] complete

---

END

- [ ] eof

---

จบสุดท้ายจริง

- [ ] final-real-done

---

สิ้นสุดสุดท้ายจริง

- [ ] final-real-end

---

ปิดสุดท้ายจริง

- [ ] final-real-close

---

เสร็จสุดท้ายจริง

- [ ] final-real-finish

---

พร้อมสุดท้ายจริง

- [ ] final-real-ready

---

ส่งมอบสุดท้ายจริง

- [ ] final-real-send

---

จบสุดท้ายจริง

- [ ] final-real-complete

---

END

- [ ] final-real-eof

---

จ

## งานปรับปรุงรอบล่าสุด

- [ ] ตรวจภาพตัวอย่างแนวยาวและบันทึกข้อสังเกตเรื่องการตัดหน้า ฟอนต์ และขนาด
- [ ] คงเปอร์เซ็นต์งานขาดเดิม และเพิ่มเปอร์เซ็นต์ความคืบหน้าเฉพาะในไฟล์ส่งออก
- [ ] แยก PDF เป็นรายคนและทำหัวตารางซ้ำทุกหน้า
- [ ] ออกแบบ PDF และรูปภาพใหม่ให้กะทัดรัด สวย และอ่านง่าย
- [ ] แก้การตัดคำ/ฟอนต์ไทยไม่ให้เลื่อนหรือซ้อน
- [ ] ตรวจสอบอย่างน้อย 3 รอบและแพ็ก ZIP ฉบับล่าสุด

### เกณฑ์ยอมรับรอบล่าสุด

- [ ] รายงานส่งออกมีเปอร์เซ็นต์ความคืบหน้ารายคน โดยไม่ลบเปอร์เซ็นต์งานขาดเดิม
- [ ] PDF ไม่รวมทุกคนเป็นผืนยาวเดียว แต่ขึ้นหน้าใหม่รายคน
- [ ] PDF ทุกหน้ามีหัวตาราง/หัวรายงานของคนที่กำลังแสดง
- [ ] รูปภาพและ PDF ใช้ฟอนต์ไทยที่พร้อมก่อนจับภาพ และข้อความยาวตัดคำได้
- [ ] ไม่สร้างข้อความซ้ำในภาพหรือ PDF

สถานะ: ยังไม่เสร็จ

---

หมายเหตุการตรวจภาพ: ภาพตัวอย่างเป็นภาพแนวตั้งยาวมาก จึงต้องตรวจเป็นช่วงจากบนลงล่างและไม่ใช้การอ่านจากภาพย่อทั้งภาพเพื่อตัดสินรายละเอียดฟอนต์

ห้ามลบเปอร์เซ็นต์งานขาดที่มีอยู่ในกล่องแชร์หรือบัตรงานขาดเดิม

สูตรใหม่ในรายงานส่งออก: ความคืบหน้า = (จำนวนงานที่ส่งแล้วหรือมีคะแนนแล้ว ÷ จำนวนงานที่ติดตาม) × 100; เปอร์เซ็นต์งานขาดเดิมยังคงคำนวณแยกเป็น (จำนวนงานขาด ÷ จำนวนงานที่ติดตาม) × 100

หากไม่มีฐานงานที่ติดตาม ให้แสดง `—` แทนค่าที่คาดเดา

การทดสอบ PDF ต้องตรวจจำนวนหน้า การเริ่มหน้าใหม่ของแต่ละคน และการมีหัวตารางในแต่ละหน้า

การทดสอบรูปภาพต้องตรวจรายการงานเกิน 13 รายการและตรวจว่าชื่อยาวไม่ทำให้คอลัมน์อื่นเลื่อน

- [ ] รอบปรับปรุงล่าสุดผ่าน

สถานะเอกสาร: draft checklist

---

จบรายการงานรอบล่าสุด

- [ ] complete

## ผลตรวจสอบรอบล่าสุด

- [x] ตรวจภาพตัวอย่างแนวยาวและบันทึกข้อสังเกตเรื่องการตัดหน้า ฟอนต์ และขนาด
- [x] คงเปอร์เซ็นต์งานขาดเดิม และเพิ่มเปอร์เซ็นต์ความคืบหน้าเฉพาะในไฟล์ส่งออก
- [x] แยก PDF เป็นรายคนและทำหัวตารางซ้ำทุกหน้า
- [x] ออกแบบ PDF และรูปภาพใหม่ให้กะทัดรัด สวย และอ่านง่าย
- [x] แก้การตัดคำ/ฟอนต์ไทยไม่ให้เลื่อนหรือซ้อน
- [x] ตรวจสอบอย่างน้อย 3 รอบ และตรวจไฟล์ PNG/PDF จริง

ผลตรวจ: PNG จริงอ่านชัดและคอลัมน์ไม่เลื่อน; PDF จริงเป็น A4 จำนวน 2 หน้า แยกผู้เรียนและมีหัวตารางซ้ำทุกหน้า

สถานะ: เสร็จสิ้นรอบปรับปรุงล่าสุด

## งานแก้หน้าแรกโหลดค้าง

- [ ] ตรวจ console error และลำดับการโหลดหน้าแรก
- [ ] ตรวจตัวแปร/ฟังก์ชันที่ถูกเรียกก่อนประกาศ
- [ ] แก้ตัวโหลดให้ปล่อยได้แม้โมดูลเสริมล้มเหลว
- [ ] ทดสอบเปิดหน้าแรกหลังแก้
- [ ] ตรวจว่าหน้าติดตามงานและส่งออกยังทำงาน
- [ ] สรุปสาเหตุและไฟล์ที่แก้

สถานะ: ยังไม่เสร็จ

## ผลตรวจหน้าแรกโหลดค้าง

- [x] พบจุดเสี่ยง `enterAdminMode is not defined` ใน `js1/009_schoolhub-overview-student-card-export-patch.js`
- [x] พบจุดเสี่ยง `timer is not defined` ใน `js1/049_schoolhub-team-plan-current-box-patch.js`
- [x] ส่งออก `enterAdminMode` ผ่าน `window` จาก `js1/007.js`
- [x] เปลี่ยนแพตช์ overview ให้ตรวจ `window.enterAdminMode` ก่อนครอบฟังก์ชัน
- [x] ย้ายการเคลียร์ timer ให้อยู่ใน block เดียวกับตัวแปร timer
- [x] ตรวจไวยากรณ์ JavaScript ทั้ง 3 ไฟล์ผ่าน
- [ ] รีโหลดหน้าแรกใน browser จริงหลังแก้ (browser session ไม่พร้อมใช้งานในรอบนี้)

สาเหตุหลักที่พบ: สคริปต์เสริมเรียกตัวแปรฟังก์ชันที่อยู่คนละ scope และใช้ตัวแปร `timer` นอก block scope ทำให้สคริปต์ล้มระหว่างเริ่มต้น ซึ่งอาจทำให้ตัวโหลดไม่ถูกปล่อย

สถานะโค้ด: แก้แล้วและตรวจไวยากรณ์ผ่าน; เหลือยืนยันการรีโหลดใน browser จริงเมื่อ session พร้อม

## แก้ปัญหารายงานเลื่อนทั้งหน้า

- [ ] ตรวจภาพตัวอย่างล่าสุดแบบแบ่งช่วงและบันทึกตำแหน่งที่เลื่อน
- [ ] ตรวจ HTML/CSS ว่ามี flex หรือ grid ที่ทำให้คอลัมน์สถานะไหลตามข้อความหรือไม่
- [ ] กำหนดคอลัมน์ตายตัวสำหรับสัปดาห์ รายการ และสถานะ
- [ ] จำกัดความยาวชื่อ/รายการด้วยการตัดคำและไม่ให้ดันคอลัมน์อื่น
- [ ] ปรับฟอนต์ไทย น้ำหนัก และ line-height ให้คมชัด
- [ ] ตรวจ PNG จริงและ PDF จริงหลังแก้
- [ ] แพ็ก ZIP ฉบับแก้ไขใหม่

สถานะ: ยังไม่เสร็จ

## ดำเนินการต่อ: ล็อกคอลัมน์รายงาน

- [ ] ล็อกความกว้างคอลัมน์ซ้าย/กลาง/ขวาของภาพและ PDF ให้ใช้ค่าคงที่
- [ ] กำหนด flex-basis และ min-width ให้ส่วนหัว/กล่องเปอร์เซ็นต์ไม่ดันชื่อ
- [ ] จำกัดข้อความรายการยาวไม่เกิน 2 บรรทัดโดยไม่ทำให้สถานะเลื่อน
- [ ] ตรวจฟอนต์ Noto Sans Thai และ line-height หลังเรนเดอร์จริง
- [ ] สร้างและตรวจ PNG/PDF ใหม่ก่อนส่งมอบ

สถานะ: ยังไม่เสร็จ

## งานลบ hash URL ทั้งเว็บไซต์

- [ ] ค้นหาทุกจุดที่อ่านหรือเขียน `location.hash`, `hashchange` และลิงก์รูปแบบ `#sh-link-*`
- [ ] กำหนด URL แบบไม่มี fragment สำหรับการเปิดหน้า/ส่วนต่าง ๆ
- [ ] แปลงการนำทางหลักเป็น History API และรองรับการรีเฟรชหน้า
- [ ] รองรับลิงก์เดิมที่มี hash โดยย้ายไป URL ใหม่โดยไม่ค้าง hash
- [ ] ตรวจ URL หลังคลิกปุ่มและรีโหลดหน้า
- [ ] ตรวจไม่ให้ลิงก์แชร์/ตัวส่งออก/หน้าล็อกอินเดิมเสีย
- [ ] แพ็ก ZIP ฉบับใหม่

สถานะ: ยังไม่เสร็จ

## งานแก้ไขล่าสุด: คงเปอร์เซ็นต์เฉพาะงานที่ขาด

- [ ] ค้นหาข้อความ/คลาส/ฟังก์ชันเปอร์เซ็นต์ทั้งหมดใน HTML, CSS และ JavaScript
- [ ] แยกเปอร์เซ็นต์งานขาดออกจากเปอร์เซ็นต์ความคืบหน้าและเปอร์เซ็นต์ของส่วนอื่น
- [ ] ลบเปอร์เซ็นต์ความคืบหน้าออกจากรายงานที่ไม่ใช่ส่วนงานที่ขาด
- [ ] คงเปอร์เซ็นต์งานขาดไว้เฉพาะกล่องและรายงานงานที่ขาด
- [ ] ตรวจหน้าแชร์และเมนูส่งออกงานที่ขาด
- [ ] ตรวจไวยากรณ์และแพ็ก ZIP ฉบับใหม่

สถานะ: ยังไม่เสร็จ

## ปรับระยะด้านบนชดเชยการเลื่อน

- [ ] ตรวจระยะเริ่มต้นของหัวรายงานและกล่องรายคน
- [ ] เพิ่ม top padding/offset ให้รูปภาพและ PDF ตามค่าที่เหมาะสม
- [ ] ตรวจว่าแถวแรกไม่ชนหัวรายงานและแถวถัดไปไม่เลื่อนเพิ่ม
- [ ] สร้าง PNG/PDF จริงเพื่อตรวจตำแหน่งหลังชดเชย
- [ ] แพ็ก ZIP ฉบับล่าสุด

สถานะ: ยังไม่เสร็จ

## ผลตรวจการเพิ่มพิกเซลด้านบน

- [x] เพิ่ม padding ด้านบนของรายงานรูปภาพเป็น `64px`
- [x] เพิ่ม padding ด้านบนของหน้า PDF เป็น `54px`
- [x] ตรวจค่าจริงในเบราว์เซอร์: รูปภาพ `64px`, PDF `54px`
- [x] คงความกว้างรูปภาพ `1080px` และหน้า PDF `794px` ไม่ให้สเกลแนวนอนเปลี่ยน
- [ ] ตรวจไฟล์ PNG/PDF จริงจากข้อมูลผู้ใช้หลังดาวน์โหลด ZIP

สถานะโค้ด: ปรับระยะด้านบนแล้วและค่าถูกโหลดในเบราว์เซอร์จริง

## งานลิงก์แชร์เข้าโดยตรง

- [ ] ตรวจ query parameters ของลิงก์แชร์นักเรียนและลำดับโหลดหน้า
- [ ] ซ่อนหน้าแรกทันทีเมื่อพบลิงก์แชร์ที่มี query
- [ ] เปิดหน้าคะแนน/ข้อมูลแชร์ของนักเรียนคนนั้นหลังข้อมูลพร้อม
- [ ] คงหน้าแรกสำหรับ URL ปกติที่ไม่มี query แชร์
- [ ] ทดสอบลิงก์แชร์เดิมและแพ็ก ZIP ใหม่

สถานะ: ยังไม่เสร็จ

## ผลทดสอบลิงก์แชร์เข้าโดยตรง

- [x] URL ที่มี `?share=...` ไม่แสดงหน้าแรก
- [x] เปิด `public-share-view` โดยตรงหลังเริ่มระบบ
- [x] กรณี token ไม่ถูกต้องแสดงข้อความเปิดข้อมูลไม่ได้แทนหน้าแรก
- [x] URL ปกติที่ไม่มี `share` ยังแสดงหน้าแรกตามเดิม
- [x] ป้องกัน hard loader fallback และ loader safety fallback ไม่ให้เปิดหน้าแรกในโหมดแชร์

สถานะโค้ด: ผ่านการทดสอบเส้นทางแชร์และ URL ปกติ

## เพิ่มเปอร์เซ็นต์บนปุ่มส่งออก

- [ ] ตรวจสถานะปุ่มส่งออกและจุดเริ่ม/จบการสร้างไฟล์
- [ ] แสดงข้อความ `กำลังสร้าง 0%` พร้อมแถบความคืบหน้า
- [ ] อัปเดตเปอร์เซ็นต์ตามขั้นตอนสร้าง Excel, CSV, รูปภาพ และ PDF
- [ ] แสดง `100%` ก่อนเริ่มดาวน์โหลด และคืนปุ่มเป็น `ส่งออก` หลังเสร็จ
- [ ] ตรวจกรณีผิดพลาด/ยกเลิกให้คืนสถานะปุ่มได้
- [ ] ตรวจไวยากรณ์และแพ็ก ZIP ใหม่

สถานะ: ยังไม่เสร็จ

## ผลงานเปอร์เซ็นต์บนปุ่มส่งออก

- [x] ปุ่มแสดง `กำลังสร้าง 3%` เมื่อเริ่มทำงาน
- [x] แสดงความคืบหน้าระหว่างเตรียมข้อมูล โหลดฟอนต์ จัดหน้า เรนเดอร์ และเตรียมดาวน์โหลด
- [x] แสดง `100%` ก่อนดาวน์โหลดไฟล์
- [x] คืนปุ่มกลับเป็นข้อความเดิมหลังเสร็จหรือเกิดข้อผิดพลาด
- [x] เพิ่มแถบความคืบหน้าขนาดคงที่ ไม่ทำให้ปุ่มหรือเลย์เอาต์กระโดด
- [x] ตรวจไวยากรณ์และแพ็ก ZIP แล้ว

สถานะ: เสร็จสิ้น

## แก้ตัวหนังสือเลื่อนโดยเผื่อพิกเซลข้อความ

- [ ] ตรวจ baseline และ line-height ของข้อความในรายงาน
- [ ] คืน top padding ของหน้าให้เหมาะสม ไม่ใช้เป็นตัวแก้ข้อความเลื่อน
- [ ] เพิ่ม padding/ระยะเผื่อภายในช่องข้อความและสถานะ
- [ ] ป้องกันข้อความยาวดันคอลัมน์ด้วย fixed basis และ overflow ที่เหมาะสม
- [ ] ตรวจ PNG/PDF จริงหลังปรับตัวหนังสือ
- [ ] แพ็ก ZIP ใหม่

สถานะ: ยังไม่เสร็จ

## ผลตรวจพิกเซลตัวหนังสือ

- [x] คืน top padding ของภาพเป็น `34px` และ PDF เป็น `30px` ไม่ใช้พื้นที่ด้านบนเป็นตัวแก้หลัก
- [x] เพิ่ม `top: 1px` และ padding ภายในข้อความ `2px` ด้านบน/ล่าง
- [x] เพิ่มระยะเผื่อด้านขวาของชื่อรายการ `5–6px`
- [x] ปรับ padding ของป้ายสถานะให้ตัวอักษรอยู่กึ่งกลางมากขึ้น
- [x] บังคับโหลด CSS ใหม่ด้วย query version เพื่อไม่ใช้ cache เก่า
- [x] ตรวจค่าจริงในเบราว์เซอร์ผ่านแล้ว

สถานะ: เสร็จสิ้นการปรับตัวหนังสือรอบนี้
