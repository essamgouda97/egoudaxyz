---
title: 'Vibe Coding مع 3D Data'
date: '2025-02-26'
excerpt: 'درّبت model بيعمل embed لـ3D CAD data وكان ممتع.'
lang: ar
---

بما ان *vibe coding* بقت مصطلح معروف دلوقتي، قررت اجربها على نوع تاني من الـdata. اشتغلت كتير مع صور وصوت ونصوص، بس عمري ما درّبت network على 3D models. حياتنا في 3D، فمنطقي نفهم ازاي نشتغل مع 3D data. 🫡

## المهمة: درّب Model كويس في عمل Embed لـ3D Models

بدأت بـ[ModelNet10 dataset](https://www.kaggle.com/datasets/balraj98/modelnet10-princeton-3d-object-dataset/data) ونفذت [PointNet](https://arxiv.org/abs/1612.00593)، شبكة عصبية بسيطة بتقبل point data غير منظمة وتنفع للـclassification والـsegmentation. بس اللي كنت عايزه فعلاً هو **"3D models → embeddings"** (يعني *قائمة ارقام بتساعد الكمبيوتر يمثل حاجات*). الـembeddings دي بتتخزن في الـglobal feature layer بتاعت PointNet (المتلونة بالأخضر).

![PointNet Architecture](static/arch.png)
*شكل 1: هندسة PointNet، مع الـglobal feature layer (الأخضر) اللي بيخزن الـembeddings.*

## الـData

اول حاجة، الـdata جاية في ملفات `.off`، format بيمثل الـfaces والـvertices بطريقة مقروءة. بفضل الـ[Kaggle notebook ده](https://www.kaggle.com/code/balraj98/pointnet-for-3d-object-classification-pytorch/notebook)، قدرت اخد code عشان اقرأ الـdata. باختصار:

- **الـFaces والـVertices:** الـvertex هو نقطة في الـ3D space، والـface هي الشكل اللي بيتكون لما النقط دي تتوصل.
- **الـMesh:** شكل منظم، مثلاً **Triangular Mesh** (face شكلها مثلث). تحت ده **تمثيل مرئي** لبانيو مقروء من ملف `.off`:

  ![Bathtub Mesh Visualization](static/bathtub_mesh.png)
  *شكل 2: تمثيل الـmesh بتاع البانيو، بيوضح هيكل الـ3D model.*

- بعد ما يبقى عندنا الـmeshes، محتاجين نعمل **sample** ليها. وبما اني بستخدم PointNet، بعمل sample للـmesh لـ**نقط!**

  ![Point Cloud Visualization](static/bathtub_points.png)
  *شكل 3: تمثيل الـpoint cloud بتاع البانيو، اللي بيتستخدم كـinput لـPointNet.*

## تدريب Self-Supervised بـNT-Xent Loss

في الواقع، **الـdata مش labeled** عشان البشر فوضى. عشان احاكي الواقع اخترت NT-Xent Loss اللي بتتستخدم عادة بطريقة self-supervised.

### ايه هو NT-Xent Loss؟

NT-Xent اختصار **Normalized Temperature-scaled Cross Entropy Loss**، وده عنصر اساسي في **contrastive learning**. بيساعد الـmodel يتعلم **representations ليها معنى** عن طريق انه يخلي الـdata points المتشابهة (positive pairs) قريبة من بعض في الـembeddings، والمختلفة (negative pairs) بعيدة عن بعض.

### اضافة MLP Head للـLoss

عشان احسن اداء الـcontrastive learning، ضفت **MLP head** فوق الـ**global feature layer** بتاع PointNet. الـMLP head ده فيه:

- **طبقة dense بـ512 بُعد** مع **BatchNorm** و**ReLU** activation.
- **طبقة projection نهائية** بتعمل map للـembeddings للـspace اللي بنستخدمه في الـNT-Xent Loss.

**خطوة الـprojection دي مهمة** عشان:

1. بت**حسّن الفصل** بين الـembeddings قبل ما نحسب الـloss.
2. بت**منع الـnetwork من collapse** لـembeddings تافهة.
3. بت**تعلم metric space احسن**، وده بيخلي الـembeddings اقوى لمقارنات التشابه.

### ازاي بيشتغل؟

1. **ربط الـData باستخدام الـLabels:**
   - الـ*anchor* والـ*positive* من نفس الـclass.
   - الـ*negative* من class مختلف.

2. **تشابه الـEmbeddings:**
   - الـMLP head بيعالج الـembeddings قبل حساب التشابه.
   - بنحسب **cosine similarity** بين كل الـembeddings في الـbatch.
   - درجات التشابه بتتقسم على **temperature parameter (τ)**، اللي بيتحكم في قد ايه عايزين نفصل الـpositive pairs عن الـnegative pairs.

3. **حساب الـContrastive Loss:**
   - الـloss function بتضمن ان التشابه بين الـ*positive pairs* يوصل لأعلى قيمة، والتشابه مع الـ*negative pairs* ينزل لأقل قيمة:

   $$
   L = -\log \frac{\exp(sim(z_i, z_j)/\tau)}{\sum_{k=1}^{N} \exp(sim(z_i, z_k)/\tau)}
   $$

### ازاي اخترت الـPositive والـNegative Samples

**غشيت** واستخدمت الـclass labels عشان اعمل *positive* و*negative* و*anchor* samples بدل ما اعتمد على augmentations.

بما ان الـdataset عليه labels، استخدمت الـclass labels الموجودة للـcontrastive learning:

- **الـAnchor:** 3D model عشوائي من class معين.
- **الـPositive:** sample تاني من نفس الـclass.
- **الـNegative:** sample من class مختلف.

لو الـdataset كان **unlabeled**، كنت هحتاج:

1. اعمل augment لنفس الـsample عشان اعمل positives.
2. اختار 3D model عشوائي كـnegative.
3. اتأكد ان الـnegatives مش شبه الـanchor اوي باستخدام feature distance constraints.

## التقييم

### منحنى الـLoss

رغم ان **الـtraining والـtest loss بينزلوا**، يعني الـmodel **بيتعلم**، الـembeddings لسه مبتكونش **clusters واضحة**. المفروض الـclasses تكون منفصلة كويس، بس الـvisualizations بتوضح overlap. بس كويسة كفاية لويكند وintro حلو لـ3D data.

![Loss Curve](static/loss.png)
*شكل 4: منحنيات الـtraining والـtest loss، بتوضح convergence الـmodel.*

![UMAP Visualization at Epoch 100](static/umap.png)
*شكل 5: تصوير UMAP للـembeddings المتعلمة عند epoch 100، بيوضح overlap بين الـclasses.*

### اسباب محتملة

1. **الـTemperature Parameter (τ)**
   - لو τ عالي اوي، الـcontrastive loss بتبقى ضعيفة والـembeddings ممكن متنفصلش كويس.
   - لو τ واطي اوي، الـloss بتبقى strict اوي وده ممكن يعمل collapse للـmodel.

2. **الـHard Negatives مش كفاية**
   - لو الـnegative samples سهلة اوي، الـmodel مش هيتعلم يفصل الـclasses كويس.
   - احسن طريقة هي **hard negative mining**، اختيار **negatives قريبة من الـanchor** بدل negatives عشوائية.

3. **مفيش Augmentations قوية**
   - الـaugmentations ممكن تدخل variability اكتر في الـpositive samples، وده يخلي الـmodel يتعلم يعمم احسن.
   - تقنيات زي **random rotations وnoise injection وjittering** ممكن تحسن متانة الـmodel.

4. **الـProjection Head ممكن يكون Shallow اوي**
   - **MLP projection head اعمق** ممكن يحسن تعلم الـfeatures.
   - **embedding space اوسع** (مثلاً 256-dimensional بدل 128) ممكن يحسن الفصل.

## الخطوات الجاية

- **ضبط الـtemperature (τ)** عشان نلاقي توازن احسن بين التشابه الـpositive والـnegative.
- **تحسين اختيار الـnegatives** عن طريق **hard negative mining** بدل اختيار عشوائي.
- **تحسين الـaugmentation pipeline** عشان نشجع تعميم احسن.
- **تجربة MLP projection head اعمق** عشان نحسن فصل الـembeddings.

## تحية لـ

- صحابي على **Kaggle** و**Hugging Face**
- **ChatGPT** و**Cursor**
- **الرياضيات** عشان رهيبة ودايماً real

## التحديات وخريطة الطريق

- عايز استخدم **dataset احسن** — لقيت dataset 3D موثوق صعب. طلبت access لـ[PartNet](https://huggingface.co/datasets/ShapeNet/PartNet-archive) على Hugging Face وبطريقة ما خدته. عند حد اقتراحات لـdatasets تانية؟
- اقدر استخدم **loss functions احسن**؟ بفكر اجرب **Triplet Loss** و**Barlow Twins Loss** واشوف لو هيحسنوا جودة الـembeddings.
- بعد كده عايز **املأ vector database** (FAISS او Milvus) واعمل searches عليها.
- فيه **architecture احسن**؟ **representation احسن** لـ3D models غير الـpoint clouds؟ يمكن اجرب **PointNet++ او model قايم على Transformer؟**

فيه تاني جاي. في الصحة 🥂
