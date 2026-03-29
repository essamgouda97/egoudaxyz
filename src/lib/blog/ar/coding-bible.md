---
title: 'كتاب الـCoding المقدس ✝️'
date: '2025-02-19'
excerpt: 'المقال ده هيتحدث كل ما الاقي قواعد جديدة ساعدتني في رحلتي مع الـcoding.'
lang: ar
---

المقال ده هيتحدث كل ما الاقي قواعد جديدة ساعدتني في رحلتي مع الـcoding. دي الممارسات والمبادئ اللي بمشي عليها.

## 1. الـHooks = code مقروء

الـhooks الكويسة بتخلي الـcode نضيف ومقروء.

## 2. اكتب الـcode فوراً، الـdebug بعدين

ابدأ اكتب الـtask من غير ما تقلق على الكمال. الـdebugging ييجي بعد كده.

## 3. تيستات، تيستات، تيستات

الـtesting مهم جداً عشان تحافظ على جودة الـcode والاستقرار.

## 4. مهارات الـdebugging لازم تكون عندك عشان تفهم اي codebase

لو فاهم debugging كويس، هتقدر تفهم وتصلح اي مشكلة في اي codebase.

## 5. حدد الـhappy paths في الـflow بتاعك

خلي عندك happy path واضح في الـcode flow بتاعك للسلوك المتوقع.

## 6. قواعد الشغل الجديد

   1. قابل اكبر عدد ممكن من الناس. اسألهم بيعملوا ايه، ايه المشاكل اللي عندهم (تقنية وغير تقنية)، وايه اللي ناويين يشتغلوا عليه.
   2. افهم الـorg chart.
   3. ارسم flow كامل end-to-end لكل حاجة ناوي تشتغل عليها.
   4. اعمل run كامل end-to-end بالـdebugger.

## 7. ابدأ بـhigh-level، وبعدين اتنقل بين الـlow-level designs والـcoding

ابدأ بـhigh-level designs وبعدين انزل للتفاصيل، وفضل اتنقل بين الـdesign والـcoding.

## 8. الـRollbacks لازم تكون سلسة

خلي عمليات الـrollback بتاعتك بسيطة وسلسة عشان متجيبش صداع.

## 9. امشي على [SemVer](https://semver.org/) `MAJOR.MINOR.PATCH (XX.XX.XX)`

   1. **MAJOR** version لما تعمل تغييرات مش متوافقة في الـAPI.
   2. **MINOR** version لما تضيف functionality متوافقة مع اللي قبلها.
   3. **PATCH** version لما تصلح bugs متوافقة مع اللي قبلها.

## 10. `{FUNCTION-SERVICE}_ENVVARNAME` للـenv vars مثلاً `REDIS_HOST`

استخدم تسمية واضحة ومنظمة للـenvironment variables.

## 11. خليك low level على قد ما تقدر. كل ما الـabstractions اقل كل ما احسن

متكترش abstractions في الاول. ركز على البساطة والوضوح.

## 12. بدل ما تعمل destructive actions مباشرة، اعمل simulation mode

لو الـsimulation mode شغال، سجل الـaction في SQLite database بدل ما تمسح حاجة.

## 13. الـDependency injection. الـFunctional programming. (شغال عليها)

استخدم dependency injection وادخل مبادئ الـfunctional programming على قد ما تقدر.

## 14. !NAMING CONVENTIONS ثابتة للأبد

خليك ثابت على naming convention واحدة لكل الـvariables والـfunctions والـservices.

## 15. الـDelays مش دايماً حاجة وحشة، خصوصاً مع requests كتير لـservice

لما يكون عندك requests كتير لـservice، الـdelays ممكن فعلاً تساعد في الـload balancing والـreliability.

## 16. افتراضات اقل، debugging اكتر

متفترضش ايه المشكلة. اعمل debug.

## 17. محدش فعلاً بيحب الـ`yamls`

الـYAMLs بتبقى فوضى بسرعة. استخدمها بحرص ومتعقدهاش.

## 18. متنضفش كل حاجة مرة واحدة (الا لو cleanup سريع طبعاً)

نضف حتة حتة عشان متعملش disruptions كبيرة.

## 19. افهم الـgit graph

لازم تقدر تتنقل بين الـcommits زي time traveler:
`git log --reverse --oneline <starting-commit-hash>..main`

## 20. افهم الفرق بين allocated memory و resident memory و phantom memory

الـallocated memory هي الـmemory اللي البرنامج حجزها ممكن تكون في الـRAM او الـdisk (swap). الـresident memory هي الـmemory اللي في الـRAM دلوقتي. الـphantom memory هي memory مش في الـRAM بس لسه محجوزة من البرنامج. [مقال كويس](https://pythonspeed.com/articles/measuring-memory-python/)

## 21. تغييرات صغيرة > تغييرات كبيرة

التغييرات الصغيرة اسهل تفهمها وتختبرها وتراجعها وتعمللها debug. خصوصاً في ML pipeline، المفروض تغير config file بس. [مقال كويس عن ML pipelines](https://arxiv.org/pdf/2209.09125)

## 22. دايماً رجع exit codes

الـscript بتاعك لازم يتعامل مع الـexit codes صح.
