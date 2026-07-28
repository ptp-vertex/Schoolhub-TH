/* Cloud Functions สำหรับ SchoolHub-TH
   ต้อง deploy ด้วย Firebase CLI: firebase deploy --only functions
   ต้องตั้งค่า custom claim "admin: true" ให้บัญชีแอดมินก่อน (ดูวิธีด้านล่างไฟล์)
*/
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/* ลบบัญชี Firebase Authentication จริง ๆ (ทำไม่ได้จาก client SDK)
   เรียกจากฝั่งเว็บด้วย: httpsCallable(functions, 'deleteUserAccount')({ uid })
   ต้องเรียกโดยผู้ใช้ที่มี custom claim admin === true เท่านั้น */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'ต้องเป็นแอดมินเท่านั้น');
  }
  const uid = data && data.uid;
  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'ต้องระบุ uid');
  }
  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (e) {
    // ผู้ใช้ที่ไม่เคยล็อกอินด้วย uid ตรง ๆ (เช่นสร้างผ่าน console) อาจหาไม่เจอ - ไม่ถือเป็น error ร้ายแรง
    if (e.code === 'auth/user-not-found') {
      return { success: true, note: 'ไม่พบบัญชีใน Auth (อาจถูกลบไปแล้วหรือไม่เคยมี)' };
    }
    throw new functions.https.HttpsError('internal', e.message || String(e));
  }
});

/* วิธีตั้ง custom claim admin ให้บัญชีแอดมิน (รันครั้งเดียวผ่าน Node script ฝั่งเครื่อง ไม่ใช่ใน function นี้):

   const admin = require('firebase-admin');
   admin.initializeApp();
   admin.auth().setCustomUserClaims('<UID_ของแอดมิน>', { admin: true })
     .then(() => console.log('ตั้งสิทธิ์แอดมินสำเร็จ'));

   หลังตั้งแล้ว แอดมินต้อง logout แล้ว login ใหม่ 1 ครั้งให้ token อัปเดต
*/
