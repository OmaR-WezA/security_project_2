# 🛡️ Security Architecture | بنية الأمان

## Overview (English)
SecureMessenger V2 relies on robust cryptographic protocols:
1. **Asymmetric RSA**: Every user possesses a mathematical key pair. Messages are sealed with the public key, ensuring only the intended recipient can read them.
2. **Secure Hashing**: We utilize **Bcrypt** for authentication security, making it nearly impossible for attackers to guess passwords even if the database is compromised.

## نظرة عامة (بالعربية)
يعتمد SecureMessenger V2 على بروتوكولات تشفير قوية:
1. **RSA غير المتماثل**: يمتلك كل مستخدم زوجاً من المفاتيح الرياضية. يتم قفل الرسائل بالمفتاح العام، مما يضمن أن المستلم المقصود فقط هو من يمكنه قراءتها.
2. **التجزئة الآمنة (Hashing)**: نستخدم **Bcrypt** لأمان المصادقة، مما يجعل من المستحيل تقريباً على المهاجمين تخمين كلمات المرور حتى في حالة اختراق قاعدة البيانات.
