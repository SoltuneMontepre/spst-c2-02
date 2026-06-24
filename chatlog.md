# SPST-C2-02

> Tôi cần làm chủ đề SPST-C2-02
>
> Topic_ID Category Chapter_Code Slot Topic_Name Core_Theory Required_Output Task_Description
>
> SPST-C2-02 SPST C2 - Phiên chợ giá trị Thị trường; quy luật giá trị; cung – cầu Sản phẩm trải nghiệm + thuyết trình Thiết kế trải nghiệm/triển lãm minh họa quy luật giá trị và cơ chế giá cho người xem.
>
> [@pdf](plugin://pdf@openai-primary-runtime) Dựa vào lý thuyết từ Slide, Tư vấn idea làm cho tôi
>
> User context
>
> Attachments:
>
> - MLN122_Chuong2_Sum26.pdf: `~/Downloads/MLN122_Chuong2_Sum26.pdf`

<details><summary>5 previous messages</summary>

> Mình sẽ dùng kỹ năng PDF để đọc đúng phần lý thuyết trong slide, rồi biến nó thành một concept trải nghiệm đủ rõ để triển khai và thuyết trình—không chỉ nêu ý tưởng chung chung.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran `Get-Content -Raw 'C:\Users\hoangnn\.codex\plugins\cache\openai-primary-runtime\pdf\26.622.11653\skills\pdf\SKILL.md'`
> - Ran `Get-Item 'C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf' | Select-Object FullName,Length,LastWriteTime; pdfinfo 'C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf'`
>
> </details>
>
> Tệp có thể mở được; công cụ Poppler hệ thống không nằm trên PATH, nên mình đang dùng bộ PDF tích hợp để trích nội dung và sẽ render riêng các trang trọng tâm về thị trường, quy luật giá trị, cung–cầu để kiểm tra cả sơ đồ lẫn chữ.
>
> <details><summary>Ran 6 commands</summary>
>
> - Ran `$py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pypdf import PdfReader
p=r"C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf"
r=PdfReader(p)
print('PAGES',len(r.pages))
for i,page in enumerate(r.pages,1):
    t=(page.extract_text() or '').replace('\x00',' ')
    one=' '.join(t.split())
    print(f'{i:03d}\t{len(t):5d}\t{one[:240]}')
'@ | & $py -`
> - Ran `$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pypdf import PdfReader
p=r"C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf"
r=PdfReader(p)
print('PAGES',len(r.pages))
for i,page in enumerate(r.pages,1):
    t=(page.extract_text() or '').replace('\x00',' ')
    one=' '.join(t.split())
    print(f'{i:03d}\t{len(t):5d}\t{one[:260]}')
'@ | & $py -`
> - Ran `$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pypdf import PdfReader
p=r"C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf"
r=PdfReader(p)
for n in [30,31,34,66,68,69,71,72,73,75,76,81,82,83,84,85,86,88,89,90,91,92,94]:
    t=(r.pages[n-1].extract_text() or '').replace('\x00',' ')
    print('\n'+'='*24+f' PAGE {n} '+'='*24)
    print(t)
'@ | & $py -`
> - Ran `Get-ChildItem 'C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin' -Filter 'pdf*.exe' | Select-Object Name,FullName`
> - Ran `Get-ChildItem 'C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime' -Recurse -Filter 'pdftoppm.exe' -ErrorAction SilentlyContinue | Select-Object -First 5 FullName`
> - Ran `$dir='C:\Users\hoangnn\Documents\Codex\2026-06-24\spst-c2-02-spst-c2-phi\work\tmp\pdfs'; New-Item -ItemType Directory -Force -Path $dir | Out-Null; $ppm='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe'; $pdf='C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf'; foreach($p in 66,81,82,83,84,85,86,89,90,91){ & $ppm -f $p -l $p -png -r 110 -singlefile $pdf (Join-Path $dir ("slide-$p")) }; Get-ChildItem $dir | Select-Object Name,Length`
>
> </details>
>
> ![Image](/C:/Users/hoangnn/Documents/Codex/2026-06-24/spst-c2-02-spst-c2-phi/work/tmp/pdfs/slide-82.png)
> ![Image](/C:/Users/hoangnn/Documents/Codex/2026-06-24/spst-c2-02-spst-c2-phi/work/tmp/pdfs/slide-86.png)
> ![Image](/C:/Users/hoangnn/Documents/Codex/2026-06-24/spst-c2-02-spst-c2-phi/work/tmp/pdfs/slide-90.png)

</details>

Ý tưởng mình khuyên chọn là:

## “Phiên chợ giá trị: Ba mùa thanh long”

Một trò chơi nhập vai 12–15 phút, mô phỏng hiện tượng “được mùa – mất giá”. Concept này bám rất sát tình huống trong slide trang PDF 91 và thể hiện được toàn bộ: thị trường, giá trị, giá cả, cung–cầu và các chủ thể.

### Cách trải nghiệm

Người tham gia nhận một trong bốn vai:

- Người sản xuất
- Người tiêu dùng
- Chủ thể trung gian
- Nhà nước

Mỗi giao dịch sử dụng tiền giả mang tên “Phi Coin”.

| Vòng                  | Tình huống                        | Kết quả dự kiến                     |
| --------------------- | --------------------------------- | ----------------------------------- |
| 1. Chợ cân bằng       | Cung = cầu                        | Giá ≈ giá trị                       |
| 2. Được mùa           | Cung > cầu                        | Hàng tồn, giá giảm dưới giá trị     |
| 3. Thanh long “viral” | Cung < cầu                        | Tranh mua, giá tăng trên giá trị    |
| 4. Đổi mới sản xuất   | Một nhà sản xuất có công nghệ mới | Chi phí cá biệt thấp, lợi nhuận cao |

Sau mỗi vòng, nhóm gắn mức giá vừa giao dịch lên biểu đồ lớn:

> **Giá chạy – Giá trị làm trục neo**

Đường giá sẽ lên xuống quanh đường giá trị, minh họa trực tiếp slide trang 82 và 86.

### Điểm “ăn tiền” về lý thuyết

Ở khu sản xuất, ba người nhận ba thẻ năng suất:

- A: 5 đơn vị lao động/thùng
- B: 2 đơn vị/thùng, cung cấp phần lớn hàng
- C: 1 đơn vị/thùng

Do B cung cấp đại bộ phận hàng hóa, thời gian lao động xã hội cần thiết được xác định là khoảng 2 đơn vị. Quy đổi 1 đơn vị lao động = 5 Phi Coin, giá trị tham chiếu của một thùng là 10 Phi Coin.

Qua trò chơi, người xem tự phát hiện:

- Giá trị được xác định bởi thời gian lao động xã hội cần thiết, không phải thời gian cá biệt.
- Cung–cầu làm giá cả dao động quanh giá trị.
- Giá cao khiến nguồn lực chảy vào sản xuất; giá thấp khiến sản xuất thu hẹp.
- Người có năng suất cao thu lợi, người có hao phí cao dễ thua lỗ.
- Cạnh tranh kích thích cải tiến kỹ thuật.

Nội dung này khớp trực tiếp slide trang 30–31 và 81–86.

### Không gian triển lãm

Chia thành bốn khu nhỏ:

1. **Xưởng sản xuất:** đóng gói thanh long giấy hoặc xếp “thùng hàng”.
2. **Khu giao dịch:** các quầy tự đặt giá và thương lượng.
3. **Bảng giá thị trường:** ghi giá, lượng cung, lượng cầu sau mỗi vòng.
4. **Góc giải mã:** giải thích quy luật giá trị và ba tác động của nó.

Đạo cụ chỉ cần thẻ thanh long, tiền giả, thẻ vai, thẻ biến cố và bảng biểu đồ nam châm.

### Cấu trúc thuyết trình

1. Câu hỏi mở đầu: “Tại sao cùng một quả thanh long nhưng hôm nay 40.000đ, tuần sau chỉ còn 10.000đ?”
2. Khái niệm thị trường.
3. Giá trị và thời gian lao động xã hội cần thiết.
4. Giới thiệu luật chơi.
5. Cho khán giả trải nghiệm ba vòng.
6. Phân tích biểu đồ giá vừa tạo.
7. Kết luận ba tác động của quy luật giá trị và vai trò bốn chủ thể.

Lưu ý quan trọng: đừng nói “cung–cầu tạo ra giá trị”. Theo slide, cung–cầu tác động trực tiếp đến **giá cả**, còn **giá trị** dựa trên hao phí lao động xã hội cần thiết.

Tên trình bày đẹp nhất theo mình là: **“Phiên chợ giá trị – Giá chạy, giá trị neo”**.

> Nhóm chúng tôi chỉ có kỹ năng code web app, tôi muốn hướng tới việc mọi người có thể cùng trải nghiệm một không gian online

Hướng phù hợp nhất là một web app multiplayer thời gian thực, giống “phòng game” hơn là website triển lãm tĩnh.

## Concept: “Phiên chợ giá trị Online”

Một người tạo phòng, hệ thống sinh mã QR. Người tham gia vào bằng điện thoại và xuất hiện dưới dạng avatar trong phiên chợ 2D chung.

Mình khuyên làm không gian 2D đồng bộ thay vì 3D: vẫn tạo cảm giác cùng hiện diện nhưng nhẹ, dễ code và tập trung vào cơ chế kinh tế.

### Luồng trải nghiệm

| Giai đoạn | Hoạt động                                               |
| --------- | ------------------------------------------------------- |
| Vào chợ   | Chọn avatar, nhận vai ngẫu nhiên                        |
| Sản xuất  | Nhà sản xuất chọn số lượng, công nghệ và giá bán        |
| Giao dịch | Người mua đặt giá; hệ thống ghép lệnh mua–bán           |
| Biến cố   | Xuất hiện thẻ “được mùa”, “viral”, “đổi mới công nghệ”… |
| Tổng kết  | Cả phòng xem đồ thị giá cả dao động quanh giá trị       |

### Bốn vai chơi

- **Người sản xuất:** chọn sản lượng, giá bán và đầu tư công nghệ.
- **Người tiêu dùng:** có ngân sách và mức nhu cầu khác nhau, đặt giá mua.
- **Trung gian:** kết nối giao dịch, quảng bá hàng hóa, nhận phí.
- **Nhà nước:** sử dụng một số chính sách giới hạn như công bố thông tin, hỗ trợ kho lạnh hoặc kiểm soát chất lượng.

Mỗi vai nên có mục tiêu điểm khác nhau, không phải ai cũng chỉ cố kiếm nhiều tiền nhất.

### Các vòng thị trường

1. **Cân bằng:** cung bằng cầu, giá gần giá trị.
2. **Được mùa:** lượng thanh long tăng mạnh, hàng tồn khiến người bán hạ giá.
3. **Thanh long viral:** cầu tăng đột ngột, người mua cạnh tranh và đẩy giá lên.
4. **Đổi mới công nghệ:** một số nhà sản xuất giảm hao phí lao động, thu lợi cao hơn.

### Điểm trực quan quan trọng nhất

Màn hình trung tâm hiển thị đồng thời:

- Đường ngang: **Giá trị**, tính từ thời gian lao động xã hội cần thiết.
- Đường biến động: **Giá thị trường**, tính từ các giao dịch thực tế.
- Cột cung và cầu từng vòng.
- Lợi nhuận và hàng tồn của từng nhà sản xuất.

Ví dụ:

```text
Giá trị = TGLĐXH cần thiết × 5 Phi Coin
Giá thị trường = trung bình các giao dịch thực tế
```

Nhờ vậy, người chơi trực tiếp tạo ra đồ thị trong slide trang 82 thay vì chỉ đứng nghe giải thích.

### Các màn hình cần làm

1. Trang tạo hoặc tham gia phòng.
2. Sảnh chợ 2D với avatar và quầy hàng.
3. Bảng điều khiển riêng theo vai.
4. Bảng giá chung cập nhật thời gian thực.
5. Màn hình phân tích cuối phiên.
6. Quiz ngắn: “Điều gì làm giá thay đổi? Điều gì quyết định giá trị?”

### Kiến trúc MVP

- Frontend responsive cho điện thoại.
- Backend quản lý phòng và luật chơi.
- WebSocket để đồng bộ giá, giao dịch, avatar và thời gian.
- Server giữ quyền quyết định trạng thái để tránh giao dịch trùng.
- Không cần tài khoản; người chơi dùng mã phòng và nickname.

Nếu thiếu thời gian, bỏ di chuyển avatar và giữ giao diện dạng “bản đồ chợ + các quầy có thể bấm”. Phần multiplayer, biến cố và đồ thị lý thuyết mới là linh hồn của sản phẩm.

Tên mình đề xuất: **“Phiên chợ giá trị Online – Giá chạy, giá trị neo.”**

> Giải thích cho tôi cơ chế của từng người chơi sẽ chơi như thế nào

Mỗi vai cần có mục tiêu, thông tin và quyền hành động riêng để tất cả người chơi đều thực sự tham gia vào thị trường.

## Chu trình của một vòng chơi

Mỗi vòng kéo dài khoảng 2–3 phút:

1. Hệ thống công bố biến cố thị trường.
2. Người chơi đưa ra quyết định riêng.
3. Chợ mở cửa, giao dịch diễn ra thời gian thực.
4. Hệ thống chốt giá, tính điểm và cập nhật biểu đồ.
5. Người chơi xem kết quả rồi điều chỉnh chiến lược cho vòng sau.

## 1. Người sản xuất

### Tài nguyên ban đầu

- Một số vốn Phi Coin.
- Năng lực lao động giới hạn mỗi vòng.
- Một công nghệ sản xuất.
- Thời gian lao động cá biệt trên mỗi thùng hàng.

Ví dụ:

| Nhà sản xuất   | Thời gian/thùng | Khả năng sản xuất |
| -------------- | --------------: | ----------------: |
| A – thủ công   | 4 điểm lao động |              Thấp |
| B – tiêu chuẩn | 2 điểm lao động |        Trung bình |
| C – hiện đại   | 1 điểm lao động |               Cao |

### Mỗi vòng được làm gì?

Người sản xuất phải quyết định:

- Sản xuất bao nhiêu thùng.
- Đặt giá bán bao nhiêu.
- Bán trực tiếp hay gửi cho trung gian.
- Giữ tiền hay đầu tư nâng cấp công nghệ.

Nếu sản xuất quá nhiều, hàng có thể không bán được. Nếu đặt giá quá cao, người mua sẽ chuyển sang quầy khác. Nếu đặt giá thấp hơn chi phí, bán được nhiều nhưng vẫn thua lỗ.

### Mục tiêu

Tối đa hóa lợi nhuận:

```text
Lợi nhuận = Doanh thu - Chi phí sản xuất - Phí trung gian - Hàng hỏng
```

Vai này thể hiện ba tác động của quy luật giá trị: điều tiết sản xuất, kích thích cải tiến và phân hóa người sản xuất.

---

## 2. Người tiêu dùng

### Tài nguyên ban đầu

Mỗi người nhận ngẫu nhiên:

- Một ngân sách.
- Nhu cầu cần mua.
- Mức giá tối đa sẵn sàng trả.
- Mức độ cấp thiết khác nhau.

Ví dụ:

> Bạn cần mua một thùng thanh long. Nếu mua được, nhận 15 điểm hài lòng. Bạn không muốn trả quá 12 Phi Coin.

### Mỗi vòng được làm gì?

Người tiêu dùng có thể:

- Xem các quầy và giá bán.
- Mua ngay hoặc chờ giá giảm.
- Đặt giá muốn mua.
- Mua trực tiếp hoặc qua trung gian.
- Chuyển sang sản phẩm thay thế nếu giá quá cao.

Khi hàng khan hiếm, người mua phải cạnh tranh và có xu hướng trả giá cao hơn. Khi hàng dư thừa, họ có nhiều lựa chọn và ép giá xuống.

### Mục tiêu

Đạt mức thỏa mãn cao với số tiền thấp:

```text
Điểm tiêu dùng = Giá trị thỏa mãn - Số tiền đã trả
```

Nếu không mua được hàng cần thiết, họ không nhận điểm thỏa mãn. Vì vậy, người chơi không thể thắng bằng cách giữ toàn bộ tiền.

---

## 3. Chủ thể trung gian

Trung gian không trực tiếp sản xuất hoặc tiêu dùng. Họ kiếm tiền bằng cách kết nối hai phía.

### Mỗi vòng được làm gì?

- Nhận hàng ký gửi từ nhà sản xuất.
- Thỏa thuận mức giá tối thiểu với người bán.
- Đặt giá bán lại cho người tiêu dùng.
- Ghép lệnh mua với lệnh bán.
- Dùng lượt quảng bá để tăng khả năng hàng được nhìn thấy.
- Đưa hàng từ khu vực dư cung sang khu vực có cầu cao.

Ví dụ:

```text
Nhà sản xuất yêu cầu tối thiểu: 8 Phi
Trung gian bán cho người tiêu dùng: 10 Phi
Trung gian nhận: 2 Phi
```

### Mục tiêu

Kiếm phí nhưng vẫn giúp hàng hóa lưu thông:

```text
Điểm trung gian = Phí kiếm được
                 + Thưởng số giao dịch
                 - Phạt hàng ký gửi không bán được
```

Nếu nâng giá quá cao, người tiêu dùng không mua. Nếu nhận quá nhiều hàng, trung gian chịu rủi ro tồn kho.

---

## 4. Nhà nước

Nhà nước không mua bán để kiếm lời. Người chơi vai này nhìn thấy bảng dữ liệu toàn thị trường:

- Tổng cung và tổng cầu.
- Giá giao dịch trung bình.
- Lượng hàng tồn.
- Số nhà sản xuất thua lỗ.
- Mức hài lòng của người tiêu dùng.

### Mỗi vòng được làm gì?

Nhà nước có ngân sách giới hạn và chỉ được chọn một chính sách:

- **Công bố dự báo nhu cầu:** giúp người sản xuất tránh sản xuất quá mức.
- **Hỗ trợ kho lạnh:** hàng tồn không bị hỏng ngay.
- **Xúc tiến xuất khẩu:** tạo thêm một lượng cầu mới.
- **Kiểm định chất lượng:** loại hàng kém chất lượng, bảo vệ người mua.
- **Hỗ trợ đổi mới công nghệ:** giảm chi phí nâng cấp sản xuất.

Chính sách không miễn phí và có thể tạo tác dụng phụ. Chẳng hạn, hỗ trợ sản xuất quá mạnh có thể khiến cung tiếp tục vượt cầu.

### Mục tiêu

Không phải giữ giá luôn cao, mà duy trì thị trường ổn định:

```text
Điểm xã hội = Giao dịch thành công
            + Mức hài lòng người tiêu dùng
            - Hàng lãng phí
            - Doanh nghiệp phá sản
            - Chi phí chính sách
```

---

## Cách hệ thống xác định giá trị và giá cả

Hai đại lượng phải được hiển thị riêng:

- **Giá trị:** dựa trên thời gian lao động xã hội cần thiết của nhóm đang cung cấp phần lớn hàng hóa.
- **Giá cả:** trung bình các giao dịch thực tế trong vòng.

Ví dụ, phần lớn hàng hóa được sản xuất trong 2 đơn vị thời gian:

```text
Giá trị tham chiếu = 2 × 5 Phi Coin = 10 Phi Coin
```

Sau đó:

- Cung > cầu → giá giao dịch có thể giảm còn 7 Phi.
- Cung < cầu → giá có thể tăng lên 14 Phi.
- Cung = cầu → giá thường gần 10 Phi.

Khi chỉ một nhà sản xuất có công nghệ mới, giá trị xã hội chưa lập tức thay đổi. Chỉ khi công nghệ mới trở nên phổ biến và cung cấp phần lớn sản lượng, thời gian lao động xã hội cần thiết mới giảm.

## Phân bổ người chơi

Với một phòng 15 người:

- 5 người sản xuất.
- 7 người tiêu dùng.
- 2 người trung gian.
- 1 người đóng vai Nhà nước.

Không nên có bảng xếp hạng chung giữa các vai. Cuối phiên nên trao các danh hiệu riêng như “Nhà sản xuất hiệu quả”, “Người tiêu dùng thông thái”, “Trung gian kết nối tốt nhất” và “Nhà điều tiết hiệu quả”.

> Idea rất hay đấy, chốt. Bây giờ tôi muốn bạn lên kế hoạch sửa lại file SRS này [SRS MLN122.md](2026-06-24/spst-c2-02-spst-c2-phi/SRS MLN122.md) theo kế hoạch của bạn. Tôi muốn bạn làm thật chi tiết, không bỏ sót một thông tin nào. Với mội một thông tin nên có cơ sở lý thuyết theo slide để đối ứng và là context để làm UI

<details><summary>16 previous messages</summary>

> Mình sẽ dùng kỹ năng PDF để đối chiếu SRS với đúng nội dung Chương 2, đồng thời đọc cấu trúc SRS hiện tại trước khi khóa kế hoạch chỉnh sửa. Ở bước này mình chỉ khảo sát và lập đặc tả thay đổi, chưa sửa file.
>
> <details><summary>Ran 3 commands</summary>
>
> - Ran ``Get-Content -Raw 'C:\Users\hoangnn\.codex\plugins\cache\openai-primary-runtime\pdf\26.622.11653\skills\pdf\SKILL.md'; Write-Output "`n---FILES---"; rg --files``
> - Ran `Get-ChildItem 'C:\Users\hoangnn\.codex\plugins\cache' -Recurse -Filter 'SKILL.md' -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match '[\\/]pdf[\\/]' } | Select-Object FullName; Get-Item 'C:\Users\hoangnn\.codex\skills\pdf\SKILL.md' -ErrorAction SilentlyContinue | Select-Object FullName`
> - Ran ``Get-Content -Raw 'C:\Users\hoangnn\.codex\plugins\cache\openai-primary-runtime\pdf\26.623.12021\skills\pdf\SKILL.md'; Write-Output "`n---SRS HEADINGS---"; rg -n '^#{1,6} ' 'SRS MLN122.md'; Write-Output "`n---SRS CONTENT---"; Get-Content -Raw 'SRS MLN122.md'``
>
> </details>
>
> SRS hiện tại mới là bản khung cho phiên chợ trực tiếp: chỉ có người mua, người bán và điều phối viên; chưa mô tả phòng online, trạng thái thời gian thực, bốn chủ thể thị trường, cách tính giá trị/giá cả, điểm số, UI hay tiêu chí nghiệm thu. Mình đang lập ma trận “lý thuyết slide → cơ chế game → dữ liệu → màn hình” để kế hoạch sửa không bị đứt đoạn giữa nội dung môn học và thiết kế sản phẩm.
>
> <details><summary>Ran a command</summary>
>
> - Ran `$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pypdf import PdfReader
p=r"C:\Users\hoangnn\Downloads\MLN122_Chuong2_Sum26.pdf"
r=PdfReader(p)
for n in [11,12,13,14,16,17,18,24,25,26,27,28,30,31,32,33,34,35,36,37,50,51,52,53,58,59,66,67,68,69,70,71,72,73,74,75,76,81,82,83,84,85,86,88,89,90,91,92,93,94]:
    t=' '.join((r.pages[n-1].extract_text() or '').replace('\x00',' ').split())
    print(f'PAGE {n}: {t}')
'@ | & $py -`
>
> </details>
>
> Có ba quyết định sản phẩm cần khóa vì chúng thay đổi gần như toàn bộ SRS: hình thức điều phối phiên chơi, quy mô phòng và mức độ phức tạp của thị trường. Mình đề xuất ưu tiên trải nghiệm lớp học đồng bộ, mobile-first và một mặt hàng để lý thuyết hiện ra rõ nhất.
>
> User input response
>
> - Bạn muốn phiên chợ online được tổ chức theo hình thức nào?
>   - Host điều phối live (Recommended)
> - Quy mô người chơi mục tiêu cho một phòng là bao nhiêu?
>   - 4–10 người
> - Phiên bản đầu nên mô phỏng bao nhiêu loại hàng hóa?
>   - Chỉ thanh long (Recommended)
>
> Với phòng 4–10 người, điểm khó nhất là vẫn phải tạo được cạnh tranh và đủ bốn chủ thể khi thiếu người. Đồng thời, cơ chế giao dịch phải đủ “thật” để giá do người chơi tạo ra nhưng không hỗn loạn đến mức kết quả trái với bài học.
>
> User input response
>
> - Bạn muốn người mua–bán giao dịch theo cơ chế nào?
>   - Niêm yết + trả giá (Recommended)
> - Khi phòng ít người và không đủ bốn vai, hệ thống nên xử lý thế nào?
>   - Bot lấp vai thiếu (Recommended)
> - Một phiên trải nghiệm hoàn chỉnh nên kéo dài bao lâu?
>   - 15–20 phút (Recommended)
>
> Phần còn lại cần khóa là mức “không gian” của UI và độ sâu kỹ thuật của chính SRS. Đây là chỗ dễ đội khối lượng nhất: bản đồ 2D có avatar khác đáng kể so với một dashboard realtime, còn SRS có hợp đồng sự kiện/dữ liệu sẽ gần như đủ để đội code bắt tay làm ngay.
>
> User input response
>
> - Giao diện phiên chợ nên mang hình thức nào?
>   - Bản đồ chợ 2D tĩnh (Recommended)
> - Người chơi nên tham gia và lưu dữ liệu theo cách nào?
>   - Có tài khoản người chơi
> - SRS mới nên chi tiết tới mức nào?
>   - Đủ để triển khai (Recommended)
>
> Bạn chọn tài khoản người chơi, nên SRS sẽ phải bổ sung xác thực, hồ sơ, lịch sử phiên và quyền riêng tư—đây không còn là chi tiết phụ. Mình cũng cần khóa ranh giới lý thuyết: “không bỏ sót” nên hiểu là không bỏ sót kiến thức liên quan trực tiếp đến trải nghiệm, chứ không nhồi toàn bộ Chương 2 vào UI.
>
> User input response
>
> - Tài khoản người chơi nên đăng nhập bằng cách nào?
>   - Google + email
> - SRS nên quy định công nghệ cụ thể hay giữ trung lập?
>   - Trung lập + REST/WebSocket (Recommended)
> - Phạm vi lý thuyết nào phải được truy vết trong SRS?
>   - Core + kiến thức nền (Recommended)
>
> Mình đã đủ nền để thiết kế SRS, nhưng còn hai lựa chọn ảnh hưởng trực tiếp đến luật chơi và tiêu chí nghiệm thu: host có được tự chế biến cố hay phải theo kịch bản chuẩn, và sản phẩm có đo được người chơi đã hiểu bài hay chỉ hiển thị kết quả thị trường.
>
> User input response
>
> - Host nên điều khiển biến cố theo cách nào?
>   - Kịch bản chuẩn 4 vòng (Recommended)
> - Có cần đo kết quả học tập ngay trong web app không?
>   - Không có quiz
>
> Plan
>
> # Kế hoạch viết lại SRS “Phiên chợ giá trị Online”
>
> ## 1. Mục tiêu bản SRS mới
>
> Viết lại toàn bộ [SRS MLN122.md](C:\Users\hoangnn\Documents\Codex\2026-06-24\spst-c2-02-spst-c2-phi\SRS MLN122.md) thành đặc tả đủ để đội phát triển triển khai web app multiplayer mà không phải tự quyết định thêm về luật chơi, UI, dữ liệu hay hành vi realtime.
>
> Sản phẩm được khóa theo các quyết định:
>
> - Phiên chợ online đồng bộ, host điều phối.
> - 4–10 người chơi; host không tính vào số ghế.
> - Một hàng hóa duy nhất: thùng thanh long.
> - Bản đồ chợ 2D tĩnh, avatar không di chuyển tự do.
> - Bốn vai thị trường: người sản xuất, người tiêu dùng, trung gian, Nhà nước.
> - Bot đảm nhiệm vai còn thiếu hoặc tạm tiếp quản người mất kết nối.
> - Giao dịch theo cơ chế niêm yết, mua ngay và trả giá.
> - Kịch bản chuẩn gồm bốn vòng, kéo dài 15–20 phút.
> - Có tài khoản bằng Google hoặc email/mật khẩu.
> - Lưu hồ sơ và lịch sử phiên; không có quiz.
> - Kiến trúc trung lập, dùng REST cho dữ liệu thông thường và WebSocket cho phiên realtime.
>
> ## 2. Cấu trúc SRS sẽ được bổ sung
>
> ### 2.1 Quản lý tài liệu
>
> Bổ sung:
>
> - Phiên bản SRS, ngày cập nhật, trạng thái tài liệu.
> - Mục đích, đối tượng đọc và tài liệu nguồn.
> - Quy ước mã yêu cầu: `LT`, `LO`, `FR`, `BR`, `UI`, `NFR`, `AC`.
> - Ghi rõ mọi số trang là số trang PDF của `MLN122_Chuong2_Sum26.pdf`.
>
> ### 2.2 Phạm vi và ranh giới
>
> Trong phạm vi:
>
> - Đăng ký, đăng nhập và hồ sơ người chơi.
> - Tạo phòng, tham gia bằng mã phòng, phân vai.
> - Phiên chơi realtime bốn vòng.
> - Thị trường, giao dịch, chính sách, bot và kết quả.
> - Lịch sử cá nhân và lịch sử phiên của host.
>
> Ngoài phạm vi phiên bản đầu:
>
> - Nhiều loại hàng hóa.
> - Bản đồ có điều khiển di chuyển.
> - Chat, voice chat và nội dung tự do.
> - Tự tạo biến cố hoặc chỉnh công thức kinh tế.
> - Quiz, bảng xếp hạng chung và phần thưởng quy đổi thật.
> - Chế độ chơi cá nhân.
> - Trang quản trị riêng.
>
> ## 3. Hệ thống truy vết lý thuyết
>
> SRS sẽ tạo danh mục lý thuyết chuẩn:
>
> | ID    | Nội dung                                           | Trang PDF |
> | ----- | -------------------------------------------------- | --------: |
> | LT-01 | Khái niệm hàng hóa                                 |        11 |
> | LT-02 | Giá trị sử dụng và giá trị                         |     12–17 |
> | LT-03 | Lao động cụ thể, lao động trừu tượng               |     24–28 |
> | LT-04 | Thời gian lao động xã hội cần thiết                |     30–31 |
> | LT-05 | Cấu thành giá trị, năng suất và cường độ lao động  |     32–36 |
> | LT-06 | Tiền là thước đo giá trị và phương tiện lưu thông  |     50–53 |
> | LT-07 | Khái niệm, vai trò và cơ chế thị trường            |     66–69 |
> | LT-08 | Ưu thế, khuyết tật và vai trò quản lý của Nhà nước |     71–76 |
> | LT-09 | Nội dung và cơ chế hoạt động của quy luật giá trị  |     81–82 |
> | LT-10 | Ba tác động của quy luật giá trị                   |     83–85 |
> | LT-11 | Quy luật cung–cầu                                  |        86 |
> | LT-12 | Quy luật cạnh tranh                                |        88 |
> | LT-13 | Bốn chủ thể thị trường                             |     89–90 |
> | LT-14 | Tình huống “được mùa–mất giá”                      |    91, 94 |
>
> Mỗi cơ chế, business rule và thành phần UI phải có bảng:
>
> - Cơ sở lý thuyết.
> - Suy luận sản phẩm từ lý thuyết.
> - Cách biểu hiện trong gameplay.
> - Cách biểu hiện trên UI.
> - Yêu cầu và tiêu chí nghiệm thu liên quan.
>
> Yêu cầu kỹ thuật như xác thực, WebSocket và bảo mật sẽ ghi nguồn là `TECH/UX`, không gán giả tạo cho slide.
>
> ## 4. Đặc tả trải nghiệm và luật chơi
>
> ### 4.1 Vòng đời phiên
>
> SRS sẽ có state machine Mermaid:
>
> ```text
> CREATED → LOBBY → INTRO
> → ROUND_1 → ROUND_2 → ROUND_3 → ROUND_4
> → DEBRIEF → COMPLETED
> ```
>
> Mỗi vòng gồm:
>
> 1. Công bố biến cố: 15 giây.
> 2. Quyết định sản xuất/chính sách: 45 giây.
> 3. Mở chợ: 60 giây.
> 4. Chốt sổ và giải thích: 30 giây.
>
> Host được start, pause, resume, gia hạn 30 giây, chuyển vòng và kết thúc; không được sửa công thức hoặc thứ tự biến cố.
>
> ### 4.2 Phân bổ vai
>
> | Người chơi | Sản xuất | Tiêu dùng | Trung gian | Nhà nước |
> | ---------: | -------: | --------: | ---------: | -------: |
> |          4 |        2 |         2 |        Bot |      Bot |
> |          5 |        2 |         2 |          1 |      Bot |
> |          6 |        2 |         2 |          1 |        1 |
> |          7 |        3 |         2 |          1 |        1 |
> |          8 |        3 |         3 |          1 |        1 |
> |          9 |        4 |         3 |          1 |        1 |
> |         10 |        4 |         4 |          1 |        1 |
>
> Hệ thống tự phân bổ; host được đổi vai trước khi bắt đầu vòng một. Sau khi bắt đầu, chỉ bot takeover mới thay đổi người điều khiển vai.
>
> ### 4.3 Cơ chế giá trị
>
> Mô hình giá trị được ghi rõ là mô phỏng giản lược:
>
> ```text
> Giá trị đơn vị = c + TGLĐXHCT × hệ số lao động
> ```
>
> Mặc định:
>
> - Giá trị đầu vào chuyển dịch `c = 2 Phi`.
> - Hệ số lao động `= 4 Phi/đơn vị thời gian`.
> - Vòng 1–3: TGLĐXHCT = 2, giá trị = 10 Phi.
> - Vòng 4: công nghệ trở thành phổ biến, TGLĐXHCT = 1, giá trị = 6 Phi.
>
> Chi phí cá biệt:
>
> ```text
> Chi phí cá biệt = 2 + thời gian cá biệt × 4
> ```
>
> Ba hồ sơ năng suất:
>
> - Truyền thống: 4 đơn vị thời gian, chi phí 18 Phi.
> - Trung bình xã hội: 2 đơn vị, chi phí 10 Phi.
> - Tiên phong: 1 đơn vị, chi phí 6 Phi.
>
> SRS phải giải thích:
>
> - Một người cải tiến chưa lập tức làm thay đổi giá trị xã hội.
> - Giá trị chỉ dịch chuyển khi công nghệ mới trở thành điều kiện sản xuất phổ biến.
> - Giá trị và chi phí cá biệt là hai đại lượng khác nhau.
> - Giá cả không được hệ thống tự áp đặt từ công thức cung–cầu.
>
> ### 4.4 Giá thị trường
>
> Giá thị trường của vòng là bình quân gia quyền theo sản lượng giao dịch:
>
> ```text
> MarketPrice = Σ(TransactionPrice × Quantity) / ΣQuantity
> ```
>
> Nếu không có giao dịch:
>
> - Không tạo giá thị trường giả.
> - Biểu đồ hiển thị khoảng trống “Không hình thành giá”.
> - Giá niêm yết không được dùng thay thế giá giao dịch.
>
> ### 4.5 Bốn vòng chuẩn
>
> 1. **Thị trường cơ sở:** cung và cầu ở mức bình thường; giá trị 10 Phi.
> 2. **Được mùa:** sản lượng đưa ra thị trường tăng 50%, làm tròn lên; cầu không đổi, giá trị ngắn hạn vẫn giữ nguyên để cô lập tác động cung.
> 3. **Thanh long viral:** nhu cầu tăng 50%, làm tròn lên; cung và giá trị không đổi.
> 4. **Công nghệ phổ biến:** năng suất xã hội tăng, TGLĐXHCT giảm từ 2 xuống 1; trục giá trị giảm từ 10 xuống 6 Phi.
>
> SRS phải ghi chú rõ việc giữ nguyên giá trị ở vòng hai là lựa chọn mô phỏng tác động cung–cầu trong ngắn hạn, tránh diễn giải sai rằng cung–cầu tạo ra giá trị.
>
> ## 5. Cơ chế từng vai
>
> ### Người sản xuất
>
> - Nhận vốn, hồ sơ năng suất, giới hạn lao động và công suất.
> - Chọn sản lượng trong khả năng tài chính và công suất.
> - Chọn bán trực tiếp hoặc chào bán sỉ cho trung gian.
> - Niêm yết giá, chấp nhận, từ chối hoặc trả giá lại.
> - Có thể đầu tư nâng cấp công nghệ; hiệu lực từ vòng sau.
> - Hàng chưa bán bị hỏng cuối vòng, trừ khi có chính sách kho lạnh.
> - Điểm dựa trên lợi nhuận thực tế, không dựa trên doanh thu.
>
> ### Người tiêu dùng
>
> - Nhận ngân sách và số lượng nhu cầu của từng vòng.
> - Xem giá, nguồn bán và lượng tồn.
> - Mua ngay hoặc gửi trả giá.
> - Có tối đa một đề nghị đang mở trên mỗi niêm yết.
> - Chỉ hàng đáp ứng nhu cầu mới tạo điểm thỏa mãn; mua dư không tạo thêm lợi ích.
> - Điểm vai trò bằng lợi ích thỏa mãn trừ số tiền đã chi.
>
> ### Trung gian
>
> - Nhận đề nghị bán sỉ từ nhà sản xuất.
> - Thương lượng giá và mua đứt hàng; thanh toán ngay.
> - Sở hữu hàng sau giao dịch sỉ và chịu rủi ro tồn kho.
> - Niêm yết lại cho người tiêu dùng.
> - Thu nhập là chênh lệch giá mua sỉ–bán lẻ.
> - Kết quả hiển thị số nhà sản xuất/người mua được kết nối và lượng tồn.
>
> ### Nhà nước
>
> - Xem dữ liệu tổng hợp; không xem ngân sách hay chiến lược riêng của từng người.
> - Có ngân sách chính sách giới hạn.
> - Chọn tối đa một chính sách mỗi vòng từ vòng hai:
>   - Công bố thông tin: hiển thị chính xác tổng cầu dự kiến.
>   - Kho lạnh: bảo toàn một phần hàng tồn sang vòng sau.
>   - Xúc tiến xuất khẩu: tạo thêm cầu hệ thống với chi phí ngân sách.
>   - Hỗ trợ công nghệ: giảm chi phí nâng cấp cho một nhà sản xuất.
> - Không được đặt giá thị trường trực tiếp.
> - Điểm xã hội dựa trên giao dịch thành công, tỷ lệ đáp ứng nhu cầu, hàng lãng phí, doanh nghiệp mất khả năng thanh toán và chi phí chính sách.
>
> Không có bảng xếp hạng chung; hệ thống trao danh hiệu riêng theo vai.
>
> ## 6. Giao dịch và tính toàn vẹn
>
> SRS sẽ đặc tả chuỗi:
>
> ```text
> Niêm yết → Mua ngay
> hoặc
> Niêm yết → Trả giá → Chấp nhận/Từ chối/Counter → Giao dịch
> ```
>
> Quy tắc bắt buộc:
>
> - Giá là số nguyên từ 1–30 Phi.
> - Không thể bán vượt tồn kho hoặc mua vượt số dư.
> - Giao dịch phải nguyên tử; khi hai người cùng mua đơn vị cuối, chỉ một người thành công.
> - Mỗi hành động có `clientActionId` để chống gửi trùng.
> - Offer hết hạn khi vòng đóng.
> - Hệ thống cập nhật ví, kho, giao dịch và biểu đồ trong cùng một transaction.
> - Giá lịch sử không được sửa sau khi vòng đã chốt.
>
> ## 7. UI/UX và context lý thuyết
>
> ### 7.1 Bản đồ chợ 2D
>
> Gồm năm khu có thể bấm:
>
> - Nông trại/Xưởng sản xuất.
> - Khu quầy bán trực tiếp.
> - Trung tâm phân phối.
> - Văn phòng Nhà nước.
> - Tháp quan sát thị trường.
>
> Avatar đứng cố định theo vai, hiển thị nickname, vai, trạng thái online/bot; không có điều khiển di chuyển.
>
> ### 7.2 Danh mục màn hình
>
> SRS sẽ mô tả cho từng màn hình: người dùng, mục tiêu, dữ liệu, hành động, trạng thái loading/empty/error/disconnected và Theory ID.
>
> 1. Đăng ký, đăng nhập Google/email, xác minh và quên mật khẩu.
> 2. Trang chủ: tạo phòng, nhập mã phòng, lịch sử.
> 3. Lobby: QR/mã phòng, danh sách người chơi, ready và phân vai.
> 4. Màn hình host/projector.
> 5. Bản đồ chợ chung.
> 6. Bảng điều khiển người sản xuất.
> 7. Khu mua hàng của người tiêu dùng.
> 8. Bảng thu mua và bán lại của trung gian.
> 9. Bảng dữ liệu và chính sách của Nhà nước.
> 10. Dialog niêm yết, mua ngay, trả giá và counter.
> 11. Tổng kết từng vòng.
> 12. Báo cáo cuối phiên.
> 13. Hồ sơ và lịch sử phiên.
>
> ### 7.3 Các thành phần UI lý thuyết bắt buộc
>
> - Thẻ hàng hóa: giá trị sử dụng và giá trị (`LT-01`, `LT-02`).
> - Thẻ lao động: hao phí cá biệt so với TGLĐXHCT (`LT-04`).
> - Phi Coin: thước đo giá trị và phương tiện lưu thông (`LT-06`).
> - Đồng hồ cung–cầu (`LT-11`).
> - Đồ thị hai đường “Giá trị” và “Giá thị trường” (`LT-09`).
> - Bảng lợi nhuận nhà sản xuất (`LT-10`).
> - Trung tâm phân phối (`LT-13`).
> - Bảng chính sách và phúc lợi xã hội (`LT-08`, `LT-13`).
> - Card “Vì sao xảy ra?” sau mỗi vòng, dùng dữ liệu thật của phiên và trích trang slide.
>
> Màu không được là phương tiện duy nhất để phân biệt cung/cầu hoặc giá trị/giá cả; phải có nhãn, biểu tượng và tooltip.
>
> ## 8. Functional Requirements
>
> Viết lại thành các nhóm có ID, priority, actor, tiền điều kiện, luồng chính, lỗi, kết quả và acceptance criteria:
>
> - `FR-AUTH`: Google, email/mật khẩu, xác minh, reset, liên kết tài khoản trùng email.
> - `FR-PROFILE`: nickname, avatar, lịch sử và xóa tài khoản.
> - `FR-ROOM`: tạo phòng, mã sáu ký tự, QR, giới hạn 4–10, ready, late join.
> - `FR-HOST`: phân vai, điều khiển phiên và xử lý mất kết nối.
> - `FR-GAME`: state machine, timer, bốn vòng và bot.
> - `FR-PRODUCER`, `FR-CONSUMER`, `FR-INTERMEDIARY`, `FR-STATE`.
> - `FR-MARKET`: niêm yết, mua ngay, offer, counter, settlement.
> - `FR-ANALYTICS`: snapshot, đồ thị, debrief và danh hiệu.
> - `FR-HISTORY`: lưu kết quả cá nhân và phiên của host.
>
> Không cho người mới tham gia sau khi vòng một bắt đầu; chỉ tài khoản đã có ghế được reconnect.
>
> ## 9. Dữ liệu và giao diện hệ thống
>
> ### 9.1 Thực thể dữ liệu
>
> Đặc tả trường, quan hệ và lifecycle cho:
>
> - `User`
> - `AuthIdentity`
> - `Session`
> - `Participant`
> - `RoleAssignment`
> - `ScenarioConfig`
> - `Round`
> - `RoleState`
> - `Inventory`
> - `Listing`
> - `Offer`
> - `Transaction`
> - `PolicyAction`
> - `MarketSnapshot`
> - `SessionResult`
> - `Badge`
>
> Kết quả phiên phải lưu scenario version để lịch sử không thay đổi khi luật cân bằng được cập nhật về sau.
>
> ### 9.2 REST
>
> REST dùng cho:
>
> - Đăng ký/đăng nhập và hồ sơ.
> - Tạo, tìm và tham gia phòng.
> - Lấy snapshot khi mở hoặc reconnect.
> - Lấy lịch sử phiên.
>
> ### 9.3 WebSocket
>
> Client commands:
>
> - `participant:ready`
> - `host:start|pause|resume|extend|next|end`
> - `producer:produce|list|wholesale|invest`
> - `consumer:buy|offer|accept_counter`
> - `intermediary:accept_wholesale|list|counter`
> - `government:apply_policy`
>
> Server events:
>
> - `session:state`
> - `participant:presence`
> - `role:assigned`
> - `round:phase_changed`
> - `market:listing_updated`
> - `market:offer_updated`
> - `market:trade_completed`
> - `government:policy_applied`
> - `market:snapshot`
> - `session:ended`
> - `action:rejected`
>
> Mọi message mang `sessionId`, `actorId`, `roundId`, `timestamp` và `stateVersion`. Server là nguồn sự thật duy nhất cho tiền, kho, giá và điểm.
>
> ## 10. Non-functional requirements
>
> - UI người chơi ưu tiên mobile portrait; host ưu tiên desktop/projector.
> - Thay đổi thị trường truyền tới toàn phòng trong tối đa 500 ms ở phân vị 95 với 10 người chơi.
> - Snapshot đầy đủ được tải lại khi reconnect.
> - Người chơi mất kết nối 15 giây được bot tiếp quản; khi trở lại có thể lấy lại vai.
> - Host mất kết nối khiến phiên tự pause; cho phép reconnect trong hai phút trước khi kết thúc với trạng thái incomplete.
> - Google và email/mật khẩu phải hợp nhất theo email đã xác minh, không tạo hai hồ sơ.
> - Mật khẩu không được lưu dạng rõ; mọi command phải xác thực và kiểm tra quyền.
> - Host chỉ thấy kết quả gameplay, không thấy email hay dữ liệu xác thực của người chơi.
> - Không tin tưởng số dư, giá trị hoặc điểm do client gửi.
> - Hỗ trợ Chrome/Edge desktop và Chrome/Safari mobile.
> - Có nhãn bàn phím/screen reader cho tất cả thao tác quan trọng.
>
> ## 11. Kiểm thử và nghiệm thu
>
> ### Lý thuyết
>
> - Giá trị mặc định tính đúng `2 + 2×4 = 10`.
> - Giá trị vòng bốn tính đúng `2 + 1×4 = 6`.
> - Người có hao phí cá biệt 1, 2 và 4 nhận kết quả lợi thế/hòa/bất lợi đúng.
> - Cung–cầu chỉ thay đổi điều kiện giao dịch, không trực tiếp ghi đè giá.
> - Không có giao dịch thì không tạo giá thị trường.
> - Mỗi màn hình/cơ chế giáo dục truy được về ít nhất một Theory ID.
>
> ### Gameplay
>
> - Kiểm thử bảng phân vai cho mọi quy mô từ 4 đến 10.
> - Mua đồng thời đơn vị cuối không gây âm kho.
> - Offer/counter hết hạn đúng lúc.
> - Chính sách không được sử dụng quá ngân sách hoặc quá một lần/vòng.
> - Bot takeover và trả quyền không làm mất ví, kho hoặc offer.
> - Bốn vòng luôn chạy đúng thứ tự và dữ liệu được lưu.
>
> ### Xác thực và quyền
>
> - Google login, email registration, xác minh, reset password và account linking.
> - Người chơi không thể gọi action của vai khác.
> - Người không thuộc phòng không nhận WebSocket event.
> - Host không thể sửa tiền, giá trị hoặc scenario constants.
>
> ### UI
>
> - Kiểm thử mobile, desktop và projector.
> - Có đầy đủ loading, empty, validation, timeout, disconnected và reconnect.
> - Biểu đồ phân biệt rõ giá trị với giá cả bằng cả màu, nhãn và kiểu đường.
> - Nội dung giải thích cuối vòng dùng đúng dữ liệu thực tế và đúng trích dẫn slide.
>
> ### Cân bằng mô phỏng
>
> Chạy bot simulation lặp lại để xác nhận:
>
> - Vòng hai tạo dư cung và xu hướng giá giảm trong phần lớn phiên.
> - Vòng ba tạo thiếu cung và xu hướng giá tăng.
> - Vòng bốn dịch chuyển trục giá trị xuống.
> - Nếu người chơi hành xử khác dự kiến, hệ thống vẫn giữ dữ liệu thật và giải thích nguyên nhân thay vì sửa kết quả.
>
> ## 12. Kiểm tra chất lượng chính file SRS
>
> Sau khi viết lại:
>
> - Kiểm tra mọi ID là duy nhất.
> - Kiểm tra mọi FR/BR/UI có source basis.
> - Kiểm tra mọi Theory ID trỏ đúng trang PDF.
> - Kiểm tra không dùng lẫn “giá trị”, “giá cả”, “chi phí cá biệt” và “TGLĐXHCT”.
> - Kiểm tra Host, Nhà nước và bot được mô tả như ba khái niệm khác nhau.
> - Kiểm tra Mermaid, bảng Markdown và liên kết mục lục hiển thị đúng.
> - Loại bỏ hoàn toàn các yêu cầu cũ mang tính triển lãm vật lý hoặc “tiền/hàng hóa mô phỏng” không có hành vi phần mềm cụ thể.
>
> Plan implementation
>
> Status: completed
>
> # Kế hoạch viết lại SRS “Phiên chợ giá trị Online”
>
> ## 1. Mục tiêu bản SRS mới
>
> Viết lại toàn bộ [SRS MLN122.md](C:\Users\hoangnn\Documents\Codex\2026-06-24\spst-c2-02-spst-c2-phi\SRS MLN122.md) thành đặc tả đủ để đội phát triển triển khai web app multiplayer mà không phải tự quyết định thêm về luật chơi, UI, dữ liệu hay hành vi realtime.
>
> Sản phẩm được khóa theo các quyết định:
>
> - Phiên chợ online đồng bộ, host điều phối.
> - 4–10 người chơi; host không tính vào số ghế.
> - Một hàng hóa duy nhất: thùng thanh long.
> - Bản đồ chợ 2D tĩnh, avatar không di chuyển tự do.
> - Bốn vai thị trường: người sản xuất, người tiêu dùng, trung gian, Nhà nước.
> - Bot đảm nhiệm vai còn thiếu hoặc tạm tiếp quản người mất kết nối.
> - Giao dịch theo cơ chế niêm yết, mua ngay và trả giá.
> - Kịch bản chuẩn gồm bốn vòng, kéo dài 15–20 phút.
> - Có tài khoản bằng Google hoặc email/mật khẩu.
> - Lưu hồ sơ và lịch sử phiên; không có quiz.
> - Kiến trúc trung lập, dùng REST cho dữ liệu thông thường và WebSocket cho phiên realtime.
>
> ## 2. Cấu trúc SRS sẽ được bổ sung
>
> ### 2.1 Quản lý tài liệu
>
> Bổ sung:
>
> - Phiên bản SRS, ngày cập nhật, trạng thái tài liệu.
> - Mục đích, đối tượng đọc và tài liệu nguồn.
> - Quy ước mã yêu cầu: `LT`, `LO`, `FR`, `BR`, `UI`, `NFR`, `AC`.
> - Ghi rõ mọi số trang là số trang PDF của `MLN122_Chuong2_Sum26.pdf`.
>
> ### 2.2 Phạm vi và ranh giới
>
> Trong phạm vi:
>
> - Đăng ký, đăng nhập và hồ sơ người chơi.
> - Tạo phòng, tham gia bằng mã phòng, phân vai.
> - Phiên chơi realtime bốn vòng.
> - Thị trường, giao dịch, chính sách, bot và kết quả.
> - Lịch sử cá nhân và lịch sử phiên của host.
>
> Ngoài phạm vi phiên bản đầu:
>
> - Nhiều loại hàng hóa.
> - Bản đồ có điều khiển di chuyển.
> - Chat, voice chat và nội dung tự do.
> - Tự tạo biến cố hoặc chỉnh công thức kinh tế.
> - Quiz, bảng xếp hạng chung và phần thưởng quy đổi thật.
> - Chế độ chơi cá nhân.
> - Trang quản trị riêng.
>
> ## 3. Hệ thống truy vết lý thuyết
>
> SRS sẽ tạo danh mục lý thuyết chuẩn:
>
> | ID    | Nội dung                                           | Trang PDF |
> | ----- | -------------------------------------------------- | --------: |
> | LT-01 | Khái niệm hàng hóa                                 |        11 |
> | LT-02 | Giá trị sử dụng và giá trị                         |     12–17 |
> | LT-03 | Lao động cụ thể, lao động trừu tượng               |     24–28 |
> | LT-04 | Thời gian lao động xã hội cần thiết                |     30–31 |
> | LT-05 | Cấu thành giá trị, năng suất và cường độ lao động  |     32–36 |
> | LT-06 | Tiền là thước đo giá trị và phương tiện lưu thông  |     50–53 |
> | LT-07 | Khái niệm, vai trò và cơ chế thị trường            |     66–69 |
> | LT-08 | Ưu thế, khuyết tật và vai trò quản lý của Nhà nước |     71–76 |
> | LT-09 | Nội dung và cơ chế hoạt động của quy luật giá trị  |     81–82 |
> | LT-10 | Ba tác động của quy luật giá trị                   |     83–85 |
> | LT-11 | Quy luật cung–cầu                                  |        86 |
> | LT-12 | Quy luật cạnh tranh                                |        88 |
> | LT-13 | Bốn chủ thể thị trường                             |     89–90 |
> | LT-14 | Tình huống “được mùa–mất giá”                      |    91, 94 |
>
> Mỗi cơ chế, business rule và thành phần UI phải có bảng:
>
> - Cơ sở lý thuyết.
> - Suy luận sản phẩm từ lý thuyết.
> - Cách biểu hiện trong gameplay.
> - Cách biểu hiện trên UI.
> - Yêu cầu và tiêu chí nghiệm thu liên quan.
>
> Yêu cầu kỹ thuật như xác thực, WebSocket và bảo mật sẽ ghi nguồn là `TECH/UX`, không gán giả tạo cho slide.
>
> ## 4. Đặc tả trải nghiệm và luật chơi
>
> ### 4.1 Vòng đời phiên
>
> SRS sẽ có state machine Mermaid:
>
> ```text
> CREATED → LOBBY → INTRO
> → ROUND_1 → ROUND_2 → ROUND_3 → ROUND_4
> → DEBRIEF → COMPLETED
> ```
>
> Mỗi vòng gồm:
>
> 1. Công bố biến cố: 15 giây.
> 2. Quyết định sản xuất/chính sách: 45 giây.
> 3. Mở chợ: 60 giây.
> 4. Chốt sổ và giải thích: 30 giây.
>
> Host được start, pause, resume, gia hạn 30 giây, chuyển vòng và kết thúc; không được sửa công thức hoặc thứ tự biến cố.
>
> ### 4.2 Phân bổ vai
>
> | Người chơi | Sản xuất | Tiêu dùng | Trung gian | Nhà nước |
> | ---------: | -------: | --------: | ---------: | -------: |
> |          4 |        2 |         2 |        Bot |      Bot |
> |          5 |        2 |         2 |          1 |      Bot |
> |          6 |        2 |         2 |          1 |        1 |
> |          7 |        3 |         2 |          1 |        1 |
> |          8 |        3 |         3 |          1 |        1 |
> |          9 |        4 |         3 |          1 |        1 |
> |         10 |        4 |         4 |          1 |        1 |
>
> Hệ thống tự phân bổ; host được đổi vai trước khi bắt đầu vòng một. Sau khi bắt đầu, chỉ bot takeover mới thay đổi người điều khiển vai.
>
> ### 4.3 Cơ chế giá trị
>
> Mô hình giá trị được ghi rõ là mô phỏng giản lược:
>
> ```text
> Giá trị đơn vị = c + TGLĐXHCT × hệ số lao động
> ```
>
> Mặc định:
>
> - Giá trị đầu vào chuyển dịch `c = 2 Phi`.
> - Hệ số lao động `= 4 Phi/đơn vị thời gian`.
> - Vòng 1–3: TGLĐXHCT = 2, giá trị = 10 Phi.
> - Vòng 4: công nghệ trở thành phổ biến, TGLĐXHCT = 1, giá trị = 6 Phi.
>
> Chi phí cá biệt:
>
> ```text
> Chi phí cá biệt = 2 + thời gian cá biệt × 4
> ```
>
> Ba hồ sơ năng suất:
>
> - Truyền thống: 4 đơn vị thời gian, chi phí 18 Phi.
> - Trung bình xã hội: 2 đơn vị, chi phí 10 Phi.
> - Tiên phong: 1 đơn vị, chi phí 6 Phi.
>
> SRS phải giải thích:
>
> - Một người cải tiến chưa lập tức làm thay đổi giá trị xã hội.
> - Giá trị chỉ dịch chuyển khi công nghệ mới trở thành điều kiện sản xuất phổ biến.
> - Giá trị và chi phí cá biệt là hai đại lượng khác nhau.
> - Giá cả không được hệ thống tự áp đặt từ công thức cung–cầu.
>
> ### 4.4 Giá thị trường
>
> Giá thị trường của vòng là bình quân gia quyền theo sản lượng giao dịch:
>
> ```text
> MarketPrice = Σ(TransactionPrice × Quantity) / ΣQuantity
> ```
>
> Nếu không có giao dịch:
>
> - Không tạo giá thị trường giả.
> - Biểu đồ hiển thị khoảng trống “Không hình thành giá”.
> - Giá niêm yết không được dùng thay thế giá giao dịch.
>
> ### 4.5 Bốn vòng chuẩn
>
> 1. **Thị trường cơ sở:** cung và cầu ở mức bình thường; giá trị 10 Phi.
> 2. **Được mùa:** sản lượng đưa ra thị trường tăng 50%, làm tròn lên; cầu không đổi, giá trị ngắn hạn vẫn giữ nguyên để cô lập tác động cung.
> 3. **Thanh long viral:** nhu cầu tăng 50%, làm tròn lên; cung và giá trị không đổi.
> 4. **Công nghệ phổ biến:** năng suất xã hội tăng, TGLĐXHCT giảm từ 2 xuống 1; trục giá trị giảm từ 10 xuống 6 Phi.
>
> SRS phải ghi chú rõ việc giữ nguyên giá trị ở vòng hai là lựa chọn mô phỏng tác động cung–cầu trong ngắn hạn, tránh diễn giải sai rằng cung–cầu tạo ra giá trị.
>
> ## 5. Cơ chế từng vai
>
> ### Người sản xuất
>
> - Nhận vốn, hồ sơ năng suất, giới hạn lao động và công suất.
> - Chọn sản lượng trong khả năng tài chính và công suất.
> - Chọn bán trực tiếp hoặc chào bán sỉ cho trung gian.
> - Niêm yết giá, chấp nhận, từ chối hoặc trả giá lại.
> - Có thể đầu tư nâng cấp công nghệ; hiệu lực từ vòng sau.
> - Hàng chưa bán bị hỏng cuối vòng, trừ khi có chính sách kho lạnh.
> - Điểm dựa trên lợi nhuận thực tế, không dựa trên doanh thu.
>
> ### Người tiêu dùng
>
> - Nhận ngân sách và số lượng nhu cầu của từng vòng.
> - Xem giá, nguồn bán và lượng tồn.
> - Mua ngay hoặc gửi trả giá.
> - Có tối đa một đề nghị đang mở trên mỗi niêm yết.
> - Chỉ hàng đáp ứng nhu cầu mới tạo điểm thỏa mãn; mua dư không tạo thêm lợi ích.
> - Điểm vai trò bằng lợi ích thỏa mãn trừ số tiền đã chi.
>
> ### Trung gian
>
> - Nhận đề nghị bán sỉ từ nhà sản xuất.
> - Thương lượng giá và mua đứt hàng; thanh toán ngay.
> - Sở hữu hàng sau giao dịch sỉ và chịu rủi ro tồn kho.
> - Niêm yết lại cho người tiêu dùng.
> - Thu nhập là chênh lệch giá mua sỉ–bán lẻ.
> - Kết quả hiển thị số nhà sản xuất/người mua được kết nối và lượng tồn.
>
> ### Nhà nước
>
> - Xem dữ liệu tổng hợp; không xem ngân sách hay chiến lược riêng của từng người.
> - Có ngân sách chính sách giới hạn.
> - Chọn tối đa một chính sách mỗi vòng từ vòng hai:
>   - Công bố thông tin: hiển thị chính xác tổng cầu dự kiến.
>   - Kho lạnh: bảo toàn một phần hàng tồn sang vòng sau.
>   - Xúc tiến xuất khẩu: tạo thêm cầu hệ thống với chi phí ngân sách.
>   - Hỗ trợ công nghệ: giảm chi phí nâng cấp cho một nhà sản xuất.
> - Không được đặt giá thị trường trực tiếp.
> - Điểm xã hội dựa trên giao dịch thành công, tỷ lệ đáp ứng nhu cầu, hàng lãng phí, doanh nghiệp mất khả năng thanh toán và chi phí chính sách.
>
> Không có bảng xếp hạng chung; hệ thống trao danh hiệu riêng theo vai.
>
> ## 6. Giao dịch và tính toàn vẹn
>
> SRS sẽ đặc tả chuỗi:
>
> ```text
> Niêm yết → Mua ngay
> hoặc
> Niêm yết → Trả giá → Chấp nhận/Từ chối/Counter → Giao dịch
> ```
>
> Quy tắc bắt buộc:
>
> - Giá là số nguyên từ 1–30 Phi.
> - Không thể bán vượt tồn kho hoặc mua vượt số dư.
> - Giao dịch phải nguyên tử; khi hai người cùng mua đơn vị cuối, chỉ một người thành công.
> - Mỗi hành động có `clientActionId` để chống gửi trùng.
> - Offer hết hạn khi vòng đóng.
> - Hệ thống cập nhật ví, kho, giao dịch và biểu đồ trong cùng một transaction.
> - Giá lịch sử không được sửa sau khi vòng đã chốt.
>
> ## 7. UI/UX và context lý thuyết
>
> ### 7.1 Bản đồ chợ 2D
>
> Gồm năm khu có thể bấm:
>
> - Nông trại/Xưởng sản xuất.
> - Khu quầy bán trực tiếp.
> - Trung tâm phân phối.
> - Văn phòng Nhà nước.
> - Tháp quan sát thị trường.
>
> Avatar đứng cố định theo vai, hiển thị nickname, vai, trạng thái online/bot; không có điều khiển di chuyển.
>
> ### 7.2 Danh mục màn hình
>
> SRS sẽ mô tả cho từng màn hình: người dùng, mục tiêu, dữ liệu, hành động, trạng thái loading/empty/error/disconnected và Theory ID.
>
> 1. Đăng ký, đăng nhập Google/email, xác minh và quên mật khẩu.
> 2. Trang chủ: tạo phòng, nhập mã phòng, lịch sử.
> 3. Lobby: QR/mã phòng, danh sách người chơi, ready và phân vai.
> 4. Màn hình host/projector.
> 5. Bản đồ chợ chung.
> 6. Bảng điều khiển người sản xuất.
> 7. Khu mua hàng của người tiêu dùng.
> 8. Bảng thu mua và bán lại của trung gian.
> 9. Bảng dữ liệu và chính sách của Nhà nước.
> 10. Dialog niêm yết, mua ngay, trả giá và counter.
> 11. Tổng kết từng vòng.
> 12. Báo cáo cuối phiên.
> 13. Hồ sơ và lịch sử phiên.
>
> ### 7.3 Các thành phần UI lý thuyết bắt buộc
>
> - Thẻ hàng hóa: giá trị sử dụng và giá trị (`LT-01`, `LT-02`).
> - Thẻ lao động: hao phí cá biệt so với TGLĐXHCT (`LT-04`).
> - Phi Coin: thước đo giá trị và phương tiện lưu thông (`LT-06`).
> - Đồng hồ cung–cầu (`LT-11`).
> - Đồ thị hai đường “Giá trị” và “Giá thị trường” (`LT-09`).
> - Bảng lợi nhuận nhà sản xuất (`LT-10`).
> - Trung tâm phân phối (`LT-13`).
> - Bảng chính sách và phúc lợi xã hội (`LT-08`, `LT-13`).
> - Card “Vì sao xảy ra?” sau mỗi vòng, dùng dữ liệu thật của phiên và trích trang slide.
>
> Màu không được là phương tiện duy nhất để phân biệt cung/cầu hoặc giá trị/giá cả; phải có nhãn, biểu tượng và tooltip.
>
> ## 8. Functional Requirements
>
> Viết lại thành các nhóm có ID, priority, actor, tiền điều kiện, luồng chính, lỗi, kết quả và acceptance criteria:
>
> - `FR-AUTH`: Google, email/mật khẩu, xác minh, reset, liên kết tài khoản trùng email.
> - `FR-PROFILE`: nickname, avatar, lịch sử và xóa tài khoản.
> - `FR-ROOM`: tạo phòng, mã sáu ký tự, QR, giới hạn 4–10, ready, late join.
> - `FR-HOST`: phân vai, điều khiển phiên và xử lý mất kết nối.
> - `FR-GAME`: state machine, timer, bốn vòng và bot.
> - `FR-PRODUCER`, `FR-CONSUMER`, `FR-INTERMEDIARY`, `FR-STATE`.
> - `FR-MARKET`: niêm yết, mua ngay, offer, counter, settlement.
> - `FR-ANALYTICS`: snapshot, đồ thị, debrief và danh hiệu.
> - `FR-HISTORY`: lưu kết quả cá nhân và phiên của host.
>
> Không cho người mới tham gia sau khi vòng một bắt đầu; chỉ tài khoản đã có ghế được reconnect.
>
> ## 9. Dữ liệu và giao diện hệ thống
>
> ### 9.1 Thực thể dữ liệu
>
> Đặc tả trường, quan hệ và lifecycle cho:
>
> - `User`
> - `AuthIdentity`
> - `Session`
> - `Participant`
> - `RoleAssignment`
> - `ScenarioConfig`
> - `Round`
> - `RoleState`
> - `Inventory`
> - `Listing`
> - `Offer`
> - `Transaction`
> - `PolicyAction`
> - `MarketSnapshot`
> - `SessionResult`
> - `Badge`
>
> Kết quả phiên phải lưu scenario version để lịch sử không thay đổi khi luật cân bằng được cập nhật về sau.
>
> ### 9.2 REST
>
> REST dùng cho:
>
> - Đăng ký/đăng nhập và hồ sơ.
> - Tạo, tìm và tham gia phòng.
> - Lấy snapshot khi mở hoặc reconnect.
> - Lấy lịch sử phiên.
>
> ### 9.3 WebSocket
>
> Client commands:
>
> - `participant:ready`
> - `host:start|pause|resume|extend|next|end`
> - `producer:produce|list|wholesale|invest`
> - `consumer:buy|offer|accept_counter`
> - `intermediary:accept_wholesale|list|counter`
> - `government:apply_policy`
>
> Server events:
>
> - `session:state`
> - `participant:presence`
> - `role:assigned`
> - `round:phase_changed`
> - `market:listing_updated`
> - `market:offer_updated`
> - `market:trade_completed`
> - `government:policy_applied`
> - `market:snapshot`
> - `session:ended`
> - `action:rejected`
>
> Mọi message mang `sessionId`, `actorId`, `roundId`, `timestamp` và `stateVersion`. Server là nguồn sự thật duy nhất cho tiền, kho, giá và điểm.
>
> ## 10. Non-functional requirements
>
> - UI người chơi ưu tiên mobile portrait; host ưu tiên desktop/projector.
> - Thay đổi thị trường truyền tới toàn phòng trong tối đa 500 ms ở phân vị 95 với 10 người chơi.
> - Snapshot đầy đủ được tải lại khi reconnect.
> - Người chơi mất kết nối 15 giây được bot tiếp quản; khi trở lại có thể lấy lại vai.
> - Host mất kết nối khiến phiên tự pause; cho phép reconnect trong hai phút trước khi kết thúc với trạng thái incomplete.
> - Google và email/mật khẩu phải hợp nhất theo email đã xác minh, không tạo hai hồ sơ.
> - Mật khẩu không được lưu dạng rõ; mọi command phải xác thực và kiểm tra quyền.
> - Host chỉ thấy kết quả gameplay, không thấy email hay dữ liệu xác thực của người chơi.
> - Không tin tưởng số dư, giá trị hoặc điểm do client gửi.
> - Hỗ trợ Chrome/Edge desktop và Chrome/Safari mobile.
> - Có nhãn bàn phím/screen reader cho tất cả thao tác quan trọng.
>
> ## 11. Kiểm thử và nghiệm thu
>
> ### Lý thuyết
>
> - Giá trị mặc định tính đúng `2 + 2×4 = 10`.
> - Giá trị vòng bốn tính đúng `2 + 1×4 = 6`.
> - Người có hao phí cá biệt 1, 2 và 4 nhận kết quả lợi thế/hòa/bất lợi đúng.
> - Cung–cầu chỉ thay đổi điều kiện giao dịch, không trực tiếp ghi đè giá.
> - Không có giao dịch thì không tạo giá thị trường.
> - Mỗi màn hình/cơ chế giáo dục truy được về ít nhất một Theory ID.
>
> ### Gameplay
>
> - Kiểm thử bảng phân vai cho mọi quy mô từ 4 đến 10.
> - Mua đồng thời đơn vị cuối không gây âm kho.
> - Offer/counter hết hạn đúng lúc.
> - Chính sách không được sử dụng quá ngân sách hoặc quá một lần/vòng.
> - Bot takeover và trả quyền không làm mất ví, kho hoặc offer.
> - Bốn vòng luôn chạy đúng thứ tự và dữ liệu được lưu.
>
> ### Xác thực và quyền
>
> - Google login, email registration, xác minh, reset password và account linking.
> - Người chơi không thể gọi action của vai khác.
> - Người không thuộc phòng không nhận WebSocket event.
> - Host không thể sửa tiền, giá trị hoặc scenario constants.
>
> ### UI
>
> - Kiểm thử mobile, desktop và projector.
> - Có đầy đủ loading, empty, validation, timeout, disconnected và reconnect.
> - Biểu đồ phân biệt rõ giá trị với giá cả bằng cả màu, nhãn và kiểu đường.
> - Nội dung giải thích cuối vòng dùng đúng dữ liệu thực tế và đúng trích dẫn slide.
>
> ### Cân bằng mô phỏng
>
> Chạy bot simulation lặp lại để xác nhận:
>
> - Vòng hai tạo dư cung và xu hướng giá giảm trong phần lớn phiên.
> - Vòng ba tạo thiếu cung và xu hướng giá tăng.
> - Vòng bốn dịch chuyển trục giá trị xuống.
> - Nếu người chơi hành xử khác dự kiến, hệ thống vẫn giữ dữ liệu thật và giải thích nguyên nhân thay vì sửa kết quả.
>
> ## 12. Kiểm tra chất lượng chính file SRS
>
> Sau khi viết lại:
>
> - Kiểm tra mọi ID là duy nhất.
> - Kiểm tra mọi FR/BR/UI có source basis.
> - Kiểm tra mọi Theory ID trỏ đúng trang PDF.
> - Kiểm tra không dùng lẫn “giá trị”, “giá cả”, “chi phí cá biệt” và “TGLĐXHCT”.
> - Kiểm tra Host, Nhà nước và bot được mô tả như ba khái niệm khác nhau.
> - Kiểm tra Mermaid, bảng Markdown và liên kết mục lục hiển thị đúng.
> - Loại bỏ hoàn toàn các yêu cầu cũ mang tính triển lãm vật lý hoặc “tiền/hàng hóa mô phỏng” không có hành vi phần mềm cụ thể.

</details>

> Thay đổi Đơn vị tiền tệ là "Đồng" chứ không phải "Phi"

<details><summary>4 previous messages</summary>

> Đã khóa đổi đơn vị sang **Đồng**. Có một chi tiết cần chốt để SRS không xuất hiện các mức giá thiếu tự nhiên như “10 Đồng”: chỉ đổi nhãn, hay đồng thời quy đổi toàn bộ thang giá sang nghìn Đồng.
>
> User input response
>
> - Các con số trong mô phỏng nên hiển thị theo thang nào?
>   - Đơn vị “nghìn Đồng”
>
> Plan
>
> # Kế hoạch viết lại SRS “Phiên chợ giá trị Online”
>
> ## 1. Mục tiêu bản SRS mới
>
> Viết lại toàn bộ `SRS MLN122.md` thành đặc tả đủ để triển khai web app multiplayer mà không phải tự quyết định thêm về luật chơi, UI, dữ liệu hay hành vi realtime.
>
> Các quyết định đã khóa:
>
> - Phiên chợ online đồng bộ, host điều phối.
> - 4–10 người chơi; host không tính vào số ghế.
> - Một hàng hóa duy nhất: thùng thanh long.
> - Bản đồ chợ 2D tĩnh, avatar không di chuyển tự do.
> - Bốn vai: người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Bot đảm nhiệm vai còn thiếu hoặc tạm tiếp quản người mất kết nối.
> - Giao dịch bằng **Đồng Việt Nam**, không sử dụng tiền “Phi”.
> - Để dễ tính, gameplay dùng thang **nghìn Đồng**: `10 nghìn Đồng = 10.000 Đồng`.
> - Giao dịch theo cơ chế niêm yết, mua ngay và trả giá.
> - Kịch bản chuẩn gồm bốn vòng, kéo dài 15–20 phút.
> - Có tài khoản bằng Google hoặc email/mật khẩu.
> - Lưu hồ sơ và lịch sử phiên; không có quiz.
> - Kiến trúc trung lập, dùng REST và WebSocket.
>
> ## 2. Cấu trúc SRS
>
> ### 2.1 Quản lý tài liệu
>
> Bổ sung:
>
> - Phiên bản, ngày cập nhật và trạng thái SRS.
> - Mục đích, đối tượng đọc và tài liệu nguồn.
> - Quy ước mã: `LT`, `LO`, `FR`, `BR`, `UI`, `NFR`, `AC`.
> - Ghi rõ số trang trích dẫn là số trang PDF của `MLN122_Chuong2_Sum26.pdf`.
>
> ### 2.2 Phạm vi
>
> Trong phạm vi:
>
> - Đăng ký, đăng nhập và hồ sơ.
> - Tạo phòng, tham gia bằng mã phòng và phân vai.
> - Phiên chơi realtime bốn vòng.
> - Sản xuất, mua bán, trung gian, chính sách và bot.
> - Biểu đồ giá trị–giá cả và tổng kết.
> - Lịch sử cá nhân và lịch sử phiên của host.
>
> Ngoài phạm vi:
>
> - Nhiều loại hàng hóa.
> - Bản đồ di chuyển tự do.
> - Chat và voice chat.
> - Tự tạo biến cố hoặc chỉnh công thức kinh tế.
> - Quiz và bảng xếp hạng chung.
> - Chế độ chơi cá nhân.
> - Trang quản trị riêng.
>
> ## 3. Hệ thống truy vết lý thuyết
>
> | ID    | Nội dung                                          | Trang PDF |
> | ----- | ------------------------------------------------- | --------: |
> | LT-01 | Khái niệm hàng hóa                                |        11 |
> | LT-02 | Giá trị sử dụng và giá trị                        |     12–17 |
> | LT-03 | Lao động cụ thể, lao động trừu tượng              |     24–28 |
> | LT-04 | Thời gian lao động xã hội cần thiết               |     30–31 |
> | LT-05 | Cấu thành giá trị, năng suất và cường độ lao động |     32–36 |
> | LT-06 | Tiền là thước đo giá trị và phương tiện lưu thông |     50–53 |
> | LT-07 | Khái niệm, vai trò và cơ chế thị trường           |     66–69 |
> | LT-08 | Khuyết tật thị trường và vai trò Nhà nước         |     71–76 |
> | LT-09 | Nội dung, cơ chế quy luật giá trị                 |     81–82 |
> | LT-10 | Ba tác động của quy luật giá trị                  |     83–85 |
> | LT-11 | Quy luật cung–cầu                                 |        86 |
> | LT-12 | Quy luật cạnh tranh                               |        88 |
> | LT-13 | Bốn chủ thể thị trường                            |     89–90 |
> | LT-14 | Tình huống “được mùa–mất giá”                     |    91, 94 |
>
> Mỗi cơ chế và thành phần UI phải nêu:
>
> - Cơ sở lý thuyết.
> - Suy luận sản phẩm.
> - Biểu hiện trong gameplay.
> - Biểu hiện trên UI.
> - Requirement và acceptance criteria liên quan.
>
> Các yêu cầu thuần kỹ thuật dùng nguồn `TECH/UX`, không gán giả tạo cho slide.
>
> ## 4. Vòng đời phiên chơi
>
> ```text
> CREATED → LOBBY → INTRO
> → ROUND_1 → ROUND_2 → ROUND_3 → ROUND_4
> → DEBRIEF → COMPLETED
> ```
>
> Mỗi vòng:
>
> 1. Công bố biến cố: 15 giây.
> 2. Quyết định sản xuất/chính sách: 45 giây.
> 3. Mở chợ: 60 giây.
> 4. Chốt sổ và giải thích: 30 giây.
>
> Host được start, pause, resume, gia hạn 30 giây, chuyển vòng và kết thúc; không được sửa công thức hoặc thứ tự biến cố.
>
> ## 5. Phân bổ vai
>
> | Người chơi | Sản xuất | Tiêu dùng | Trung gian | Nhà nước |
> | ---------: | -------: | --------: | ---------: | -------: |
> |          4 |        2 |         2 |        Bot |      Bot |
> |          5 |        2 |         2 |          1 |      Bot |
> |          6 |        2 |         2 |          1 |        1 |
> |          7 |        3 |         2 |          1 |        1 |
> |          8 |        3 |         3 |          1 |        1 |
> |          9 |        4 |         3 |          1 |        1 |
> |         10 |        4 |         4 |          1 |        1 |
>
> Hệ thống tự phân bổ; host được đổi vai trước vòng một. Sau khi bắt đầu, vai chỉ thay đổi khi bot takeover.
>
> ## 6. Tiền tệ và biểu diễn giá
>
> ### 6.1 Quy ước
>
> - Tiền tệ chính thức: **Đồng Việt Nam – VND**.
> - Gameplay hiển thị theo **nghìn Đồng** để số liệu ngắn và dễ tính.
> - Ví dụ: `10 nghìn Đồng`, tương đương `10.000 Đồng`.
> - Tooltip hoặc màn hình chi tiết hiển thị giá trị đầy đủ bằng Đồng.
> - Không sử dụng tên “Phi Coin”, ký hiệu “Phi” hoặc tiền hư cấu.
>
> ### 6.2 Lưu trữ kỹ thuật
>
> Tiền được lưu bằng số nguyên Đồng:
>
> ```text
> 10 nghìn Đồng → amountVnd = 10000
> 6 nghìn Đồng  → amountVnd = 6000
> ```
>
> Quy tắc:
>
> - Không lưu tiền bằng số thực.
> - Mọi giá trong gameplay là bội số của 1.000 Đồng.
> - API và WebSocket truyền `amountVnd`.
> - UI chịu trách nhiệm định dạng thành `10 nghìn Đồng` hoặc `10.000 Đồng`.
>
> Cơ sở: tiền biểu hiện giá trị và làm phương tiện lưu thông (`LT-06`, trang 50–53).
>
> ## 7. Cơ chế giá trị
>
> Mô hình giản lược:
>
> ```text
> Giá trị đơn vị = c + TGLĐXHCT × hệ số lao động
> ```
>
> Mặc định:
>
> - Giá trị đầu vào chuyển dịch `c = 2 nghìn Đồng`.
> - Hệ số lao động `= 4 nghìn Đồng/đơn vị thời gian`.
> - Vòng 1–3: TGLĐXHCT = 2.
> - Giá trị xã hội = `2 + 2×4 = 10 nghìn Đồng`.
> - Vòng 4: TGLĐXHCT giảm còn 1.
> - Giá trị xã hội mới = `2 + 1×4 = 6 nghìn Đồng`.
>
> Công thức lưu trữ:
>
> ```text
> unitValueVnd = 2000 + socialLaborTime × 4000
> ```
>
> Chi phí cá biệt:
>
> | Hồ sơ             | Thời gian cá biệt | Chi phí cá biệt |
> | ----------------- | ----------------: | --------------: |
> | Truyền thống      |                 4 |   18 nghìn Đồng |
> | Trung bình xã hội |                 2 |   10 nghìn Đồng |
> | Tiên phong        |                 1 |    6 nghìn Đồng |
>
> SRS phải phân biệt:
>
> - Giá trị xã hội.
> - Hao phí và chi phí cá biệt.
> - Giá niêm yết.
> - Giá giao dịch.
> - Giá thị trường của vòng.
>
> Một người cải tiến chưa làm thay đổi giá trị xã hội. Giá trị chỉ giảm khi công nghệ mới trở thành điều kiện sản xuất phổ biến.
>
> ## 8. Giá thị trường
>
> ```text
> MarketPriceVnd =
> Σ(TransactionPriceVnd × Quantity) / ΣQuantity
> ```
>
> Kết quả làm tròn tới 1.000 Đồng gần nhất khi hiển thị.
>
> Nếu không có giao dịch:
>
> - Không tạo giá thị trường giả.
> - Biểu đồ ghi “Không hình thành giá”.
> - Không sử dụng giá niêm yết thay cho giá giao dịch.
>
> Cung–cầu chỉ thay đổi điều kiện giao dịch và hành vi người chơi; hệ thống không tự tăng hoặc giảm giá.
>
> ## 9. Bốn vòng chuẩn
>
> 1. **Thị trường cơ sở:** cung và cầu bình thường; giá trị 10 nghìn Đồng.
> 2. **Được mùa:** sản lượng đưa ra thị trường tăng 50%, làm tròn lên; cầu và giá trị ngắn hạn không đổi.
> 3. **Thanh long viral:** nhu cầu tăng 50%, làm tròn lên; cung và giá trị không đổi.
> 4. **Công nghệ phổ biến:** năng suất xã hội tăng; giá trị giảm từ 10 xuống 6 nghìn Đồng.
>
> SRS phải giải thích rằng vòng hai giữ nguyên trục giá trị để cô lập tác động ngắn hạn của cung–cầu, không khẳng định cung–cầu tạo ra giá trị.
>
> ## 10. Cơ chế từng vai
>
> ### Người sản xuất
>
> - Nhận vốn bằng Đồng, hồ sơ năng suất và công suất.
> - Chọn sản lượng.
> - Chọn bán trực tiếp hoặc bán sỉ cho trung gian.
> - Niêm yết, chấp nhận, từ chối hoặc counter offer.
> - Có thể đầu tư nâng cấp công nghệ.
> - Hàng tồn bị hỏng cuối vòng nếu không có kho lạnh.
> - Kết quả dựa trên lợi nhuận, không chỉ doanh thu.
>
> ```text
> Lợi nhuận = Doanh thu - Chi phí sản xuất - Chi phí đầu tư
> ```
>
> ### Người tiêu dùng
>
> - Nhận ngân sách bằng Đồng và nhu cầu từng vòng.
> - Xem giá, nguồn bán và tồn kho.
> - Mua ngay hoặc trả giá.
> - Có tối đa một offer đang mở trên mỗi niêm yết.
> - Mua dư nhu cầu không tạo thêm điểm thỏa mãn.
>
> ```text
> Điểm tiêu dùng = Lợi ích thỏa mãn - Số tiền đã trả
> ```
>
> ### Trung gian
>
> - Nhận đề nghị bán sỉ.
> - Thương lượng và mua đứt hàng.
> - Thanh toán cho nhà sản xuất ngay.
> - Niêm yết lại và chịu rủi ro hàng tồn.
>
> ```text
> Lợi nhuận trung gian = Doanh thu bán lẻ - Chi phí mua sỉ
> ```
>
> ### Nhà nước
>
> - Xem dữ liệu tổng hợp.
> - Có ngân sách chính sách giới hạn bằng Đồng.
> - Chọn tối đa một chính sách mỗi vòng từ vòng hai:
>   - Công bố thông tin.
>   - Hỗ trợ kho lạnh.
>   - Xúc tiến xuất khẩu.
>   - Hỗ trợ công nghệ.
> - Không được trực tiếp đặt giá thị trường.
>
> Không có bảng xếp hạng chung; mỗi vai nhận danh hiệu riêng.
>
> ## 11. Giao dịch và tính toàn vẹn
>
> ```text
> Niêm yết → Mua ngay
> hoặc
> Niêm yết → Trả giá → Accept/Reject/Counter → Giao dịch
> ```
>
> Quy tắc:
>
> - Giá từ 1–30 nghìn Đồng.
> - Giá phải là bội số của 1.000 Đồng.
> - Không bán vượt tồn kho hoặc mua vượt số dư.
> - Giao dịch phải nguyên tử.
> - Hai người cùng mua đơn vị cuối: chỉ một người thành công.
> - Mỗi action có `clientActionId` chống gửi trùng.
> - Offer hết hạn khi vòng đóng.
> - Ví, kho, giao dịch và biểu đồ cập nhật trong cùng transaction.
> - Dữ liệu vòng đã chốt không được sửa.
>
> ## 12. UI/UX
>
> ### 12.1 Bản đồ chợ 2D
>
> Gồm:
>
> - Nông trại/Xưởng sản xuất.
> - Quầy bán trực tiếp.
> - Trung tâm phân phối.
> - Văn phòng Nhà nước.
> - Tháp quan sát thị trường.
>
> Avatar đứng cố định theo vai và hiển thị nickname, vai, trạng thái online/bot.
>
> ### 12.2 Màn hình
>
> 1. Đăng ký và đăng nhập.
> 2. Trang chủ và lịch sử.
> 3. Tạo/tham gia phòng.
> 4. Lobby và phân vai.
> 5. Host/projector view.
> 6. Bản đồ chợ.
> 7. Dashboard người sản xuất.
> 8. Khu mua hàng.
> 9. Dashboard trung gian.
> 10. Dashboard Nhà nước.
> 11. Dialog niêm yết, mua và trả giá.
> 12. Tổng kết vòng.
> 13. Báo cáo cuối phiên.
> 14. Hồ sơ và lịch sử.
>
> ### 12.3 Thành phần lý thuyết
>
> - Thẻ giá trị sử dụng và giá trị.
> - Thẻ hao phí cá biệt/TGLĐXHCT.
> - Ví **Đồng** và tooltip giải thích chức năng tiền tệ.
> - Đồng hồ cung–cầu.
> - Đồ thị “Giá trị” và “Giá thị trường”.
> - Bảng lợi nhuận nhà sản xuất.
> - Trung tâm phân phối.
> - Bảng chính sách.
> - Card “Vì sao xảy ra?” sau mỗi vòng.
>
> Mỗi số tiền hiển thị nhất quán:
>
> ```text
> 10 nghìn Đồng
> Tương đương: 10.000 Đồng
> ```
>
> Không sử dụng màu làm phương tiện phân biệt duy nhất.
>
> ## 13. Functional Requirements
>
> Các nhóm yêu cầu:
>
> - `FR-AUTH`: Google, email/mật khẩu, xác minh, reset và liên kết tài khoản.
> - `FR-PROFILE`: nickname, avatar, lịch sử và xóa tài khoản.
> - `FR-ROOM`: mã phòng, QR, ready và giới hạn 4–10.
> - `FR-HOST`: phân vai và điều khiển phiên.
> - `FR-GAME`: state machine, timer, bốn vòng và bot.
> - `FR-PRODUCER`
> - `FR-CONSUMER`
> - `FR-INTERMEDIARY`
> - `FR-STATE`
> - `FR-MARKET`: listing, buy, offer, counter và settlement.
> - `FR-ANALYTICS`: snapshot, đồ thị và debrief.
> - `FR-HISTORY`: lưu kết quả cá nhân và phiên host.
>
> Mỗi FR phải có actor, priority, tiền điều kiện, luồng chính, lỗi, hậu điều kiện, Theory ID và acceptance criteria.
>
> ## 14. Mô hình dữ liệu
>
> Đặc tả:
>
> - `User`
> - `AuthIdentity`
> - `Session`
> - `Participant`
> - `RoleAssignment`
> - `ScenarioConfig`
> - `Round`
> - `RoleState`
> - `Wallet`
> - `Inventory`
> - `Listing`
> - `Offer`
> - `Transaction`
> - `PolicyAction`
> - `MarketSnapshot`
> - `SessionResult`
> - `Badge`
>
> Tất cả trường tiền sử dụng hậu tố `Vnd`, ví dụ:
>
> - `balanceVnd`
> - `askPriceVnd`
> - `offerPriceVnd`
> - `transactionPriceVnd`
> - `unitValueVnd`
> - `policyCostVnd`
>
> ## 15. REST và WebSocket
>
> ### REST
>
> Dùng cho:
>
> - Xác thực và hồ sơ.
> - Tạo, tìm và tham gia phòng.
> - Lấy snapshot khi mở/reconnect.
> - Lấy lịch sử.
>
> ### WebSocket commands
>
> - `participant:ready`
> - `host:start|pause|resume|extend|next|end`
> - `producer:produce|list|wholesale|invest`
> - `consumer:buy|offer|accept_counter`
> - `intermediary:accept_wholesale|list|counter`
> - `government:apply_policy`
>
> ### Server events
>
> - `session:state`
> - `participant:presence`
> - `role:assigned`
> - `round:phase_changed`
> - `market:listing_updated`
> - `market:offer_updated`
> - `market:trade_completed`
> - `government:policy_applied`
> - `market:snapshot`
> - `session:ended`
> - `action:rejected`
>
> Mọi message mang `sessionId`, `actorId`, `roundId`, `timestamp` và `stateVersion`. Server là nguồn sự thật cho tiền, kho, giá và điểm.
>
> ## 16. Non-functional requirements
>
> - Mobile-first cho người chơi; desktop/projector cho host.
> - Event truyền tới toàn phòng trong tối đa 500 ms ở phân vị 95.
> - Reconnect bằng snapshot đầy đủ.
> - Mất kết nối 15 giây: bot tiếp quản.
> - Host mất kết nối: tự pause và chờ hai phút.
> - Hợp nhất Google/email theo email đã xác minh.
> - Không lưu mật khẩu dạng rõ.
> - Host không thấy email riêng tư của người chơi.
> - Client không được tự quyết định số dư, giá trị hoặc điểm.
> - Hỗ trợ Chrome/Edge desktop và Chrome/Safari mobile.
> - Các thao tác chính có nhãn hỗ trợ bàn phím và screen reader.
>
> ## 17. Kiểm thử
>
> ### Lý thuyết và tiền tệ
>
> - Giá trị mặc định: `2.000 + 2×4.000 = 10.000 Đồng`.
> - Giá trị vòng bốn: `2.000 + 1×4.000 = 6.000 Đồng`.
> - UI hiển thị tương ứng `10 nghìn Đồng` và `6 nghìn Đồng`.
> - Không còn chuỗi “Phi Coin” hoặc đơn vị “Phi”.
> - Giá trị, chi phí cá biệt và giá giao dịch không bị dùng lẫn.
> - Cung–cầu không trực tiếp ghi đè giá.
> - Không có giao dịch thì không tạo giá thị trường.
>
> ### Gameplay
>
> - Kiểm thử phân vai từ 4–10 người.
> - Không âm ví hoặc âm kho.
> - Giao dịch đồng thời xử lý nguyên tử.
> - Offer/counter hết hạn đúng.
> - Chính sách tuân thủ ngân sách.
> - Bot takeover không làm mất trạng thái.
> - Bốn vòng chạy đúng thứ tự.
>
> ### Xác thực và quyền
>
> - Google login.
> - Đăng ký email, xác minh và reset password.
> - Liên kết tài khoản trùng email.
> - Không gọi được action của vai khác.
> - Người ngoài phòng không nhận event.
>
> ### UI
>
> - Kiểm thử mobile, desktop và projector.
> - Kiểm tra loading, empty, error, timeout và reconnect.
> - Mọi số tiền định dạng nhất quán theo nghìn Đồng.
> - Đồ thị phân biệt rõ giá trị và giá thị trường.
> - Card giải thích dùng đúng dữ liệu và trang slide.
>
> ## 18. Kiểm tra chất lượng file SRS
>
> - Mọi ID phải duy nhất.
> - Mọi FR/BR/UI phải có source basis.
> - Mọi Theory ID phải trỏ đúng trang PDF.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Phân biệt rõ Host, Nhà nước và bot.
> - Kiểm tra Mermaid và bảng Markdown.
> - Tìm toàn file để bảo đảm không còn `Phi Coin`, `PhiCoin` hoặc tiền mô phỏng “Phi”.
> - Quy ước cuối cùng phải thống nhất: tiền tệ là **Đồng**, gameplay trình bày theo **nghìn Đồng**, dữ liệu lưu bằng số nguyên VND.
>
> Plan implementation
>
> Status: completed
>
> # Kế hoạch viết lại SRS “Phiên chợ giá trị Online”
>
> ## 1. Mục tiêu bản SRS mới
>
> Viết lại toàn bộ `SRS MLN122.md` thành đặc tả đủ để triển khai web app multiplayer mà không phải tự quyết định thêm về luật chơi, UI, dữ liệu hay hành vi realtime.
>
> Các quyết định đã khóa:
>
> - Phiên chợ online đồng bộ, host điều phối.
> - 4–10 người chơi; host không tính vào số ghế.
> - Một hàng hóa duy nhất: thùng thanh long.
> - Bản đồ chợ 2D tĩnh, avatar không di chuyển tự do.
> - Bốn vai: người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Bot đảm nhiệm vai còn thiếu hoặc tạm tiếp quản người mất kết nối.
> - Giao dịch bằng **Đồng Việt Nam**, không sử dụng tiền “Phi”.
> - Để dễ tính, gameplay dùng thang **nghìn Đồng**: `10 nghìn Đồng = 10.000 Đồng`.
> - Giao dịch theo cơ chế niêm yết, mua ngay và trả giá.
> - Kịch bản chuẩn gồm bốn vòng, kéo dài 15–20 phút.
> - Có tài khoản bằng Google hoặc email/mật khẩu.
> - Lưu hồ sơ và lịch sử phiên; không có quiz.
> - Kiến trúc trung lập, dùng REST và WebSocket.
>
> ## 2. Cấu trúc SRS
>
> ### 2.1 Quản lý tài liệu
>
> Bổ sung:
>
> - Phiên bản, ngày cập nhật và trạng thái SRS.
> - Mục đích, đối tượng đọc và tài liệu nguồn.
> - Quy ước mã: `LT`, `LO`, `FR`, `BR`, `UI`, `NFR`, `AC`.
> - Ghi rõ số trang trích dẫn là số trang PDF của `MLN122_Chuong2_Sum26.pdf`.
>
> ### 2.2 Phạm vi
>
> Trong phạm vi:
>
> - Đăng ký, đăng nhập và hồ sơ.
> - Tạo phòng, tham gia bằng mã phòng và phân vai.
> - Phiên chơi realtime bốn vòng.
> - Sản xuất, mua bán, trung gian, chính sách và bot.
> - Biểu đồ giá trị–giá cả và tổng kết.
> - Lịch sử cá nhân và lịch sử phiên của host.
>
> Ngoài phạm vi:
>
> - Nhiều loại hàng hóa.
> - Bản đồ di chuyển tự do.
> - Chat và voice chat.
> - Tự tạo biến cố hoặc chỉnh công thức kinh tế.
> - Quiz và bảng xếp hạng chung.
> - Chế độ chơi cá nhân.
> - Trang quản trị riêng.
>
> ## 3. Hệ thống truy vết lý thuyết
>
> | ID    | Nội dung                                          | Trang PDF |
> | ----- | ------------------------------------------------- | --------: |
> | LT-01 | Khái niệm hàng hóa                                |        11 |
> | LT-02 | Giá trị sử dụng và giá trị                        |     12–17 |
> | LT-03 | Lao động cụ thể, lao động trừu tượng              |     24–28 |
> | LT-04 | Thời gian lao động xã hội cần thiết               |     30–31 |
> | LT-05 | Cấu thành giá trị, năng suất và cường độ lao động |     32–36 |
> | LT-06 | Tiền là thước đo giá trị và phương tiện lưu thông |     50–53 |
> | LT-07 | Khái niệm, vai trò và cơ chế thị trường           |     66–69 |
> | LT-08 | Khuyết tật thị trường và vai trò Nhà nước         |     71–76 |
> | LT-09 | Nội dung, cơ chế quy luật giá trị                 |     81–82 |
> | LT-10 | Ba tác động của quy luật giá trị                  |     83–85 |
> | LT-11 | Quy luật cung–cầu                                 |        86 |
> | LT-12 | Quy luật cạnh tranh                               |        88 |
> | LT-13 | Bốn chủ thể thị trường                            |     89–90 |
> | LT-14 | Tình huống “được mùa–mất giá”                     |    91, 94 |
>
> Mỗi cơ chế và thành phần UI phải nêu:
>
> - Cơ sở lý thuyết.
> - Suy luận sản phẩm.
> - Biểu hiện trong gameplay.
> - Biểu hiện trên UI.
> - Requirement và acceptance criteria liên quan.
>
> Các yêu cầu thuần kỹ thuật dùng nguồn `TECH/UX`, không gán giả tạo cho slide.
>
> ## 4. Vòng đời phiên chơi
>
> ```text
> CREATED → LOBBY → INTRO
> → ROUND_1 → ROUND_2 → ROUND_3 → ROUND_4
> → DEBRIEF → COMPLETED
> ```
>
> Mỗi vòng:
>
> 1. Công bố biến cố: 15 giây.
> 2. Quyết định sản xuất/chính sách: 45 giây.
> 3. Mở chợ: 60 giây.
> 4. Chốt sổ và giải thích: 30 giây.
>
> Host được start, pause, resume, gia hạn 30 giây, chuyển vòng và kết thúc; không được sửa công thức hoặc thứ tự biến cố.
>
> ## 5. Phân bổ vai
>
> | Người chơi | Sản xuất | Tiêu dùng | Trung gian | Nhà nước |
> | ---------: | -------: | --------: | ---------: | -------: |
> |          4 |        2 |         2 |        Bot |      Bot |
> |          5 |        2 |         2 |          1 |      Bot |
> |          6 |        2 |         2 |          1 |        1 |
> |          7 |        3 |         2 |          1 |        1 |
> |          8 |        3 |         3 |          1 |        1 |
> |          9 |        4 |         3 |          1 |        1 |
> |         10 |        4 |         4 |          1 |        1 |
>
> Hệ thống tự phân bổ; host được đổi vai trước vòng một. Sau khi bắt đầu, vai chỉ thay đổi khi bot takeover.
>
> ## 6. Tiền tệ và biểu diễn giá
>
> ### 6.1 Quy ước
>
> - Tiền tệ chính thức: **Đồng Việt Nam – VND**.
> - Gameplay hiển thị theo **nghìn Đồng** để số liệu ngắn và dễ tính.
> - Ví dụ: `10 nghìn Đồng`, tương đương `10.000 Đồng`.
> - Tooltip hoặc màn hình chi tiết hiển thị giá trị đầy đủ bằng Đồng.
> - Không sử dụng tên “Phi Coin”, ký hiệu “Phi” hoặc tiền hư cấu.
>
> ### 6.2 Lưu trữ kỹ thuật
>
> Tiền được lưu bằng số nguyên Đồng:
>
> ```text
> 10 nghìn Đồng → amountVnd = 10000
> 6 nghìn Đồng  → amountVnd = 6000
> ```
>
> Quy tắc:
>
> - Không lưu tiền bằng số thực.
> - Mọi giá trong gameplay là bội số của 1.000 Đồng.
> - API và WebSocket truyền `amountVnd`.
> - UI chịu trách nhiệm định dạng thành `10 nghìn Đồng` hoặc `10.000 Đồng`.
>
> Cơ sở: tiền biểu hiện giá trị và làm phương tiện lưu thông (`LT-06`, trang 50–53).
>
> ## 7. Cơ chế giá trị
>
> Mô hình giản lược:
>
> ```text
> Giá trị đơn vị = c + TGLĐXHCT × hệ số lao động
> ```
>
> Mặc định:
>
> - Giá trị đầu vào chuyển dịch `c = 2 nghìn Đồng`.
> - Hệ số lao động `= 4 nghìn Đồng/đơn vị thời gian`.
> - Vòng 1–3: TGLĐXHCT = 2.
> - Giá trị xã hội = `2 + 2×4 = 10 nghìn Đồng`.
> - Vòng 4: TGLĐXHCT giảm còn 1.
> - Giá trị xã hội mới = `2 + 1×4 = 6 nghìn Đồng`.
>
> Công thức lưu trữ:
>
> ```text
> unitValueVnd = 2000 + socialLaborTime × 4000
> ```
>
> Chi phí cá biệt:
>
> | Hồ sơ             | Thời gian cá biệt | Chi phí cá biệt |
> | ----------------- | ----------------: | --------------: |
> | Truyền thống      |                 4 |   18 nghìn Đồng |
> | Trung bình xã hội |                 2 |   10 nghìn Đồng |
> | Tiên phong        |                 1 |    6 nghìn Đồng |
>
> SRS phải phân biệt:
>
> - Giá trị xã hội.
> - Hao phí và chi phí cá biệt.
> - Giá niêm yết.
> - Giá giao dịch.
> - Giá thị trường của vòng.
>
> Một người cải tiến chưa làm thay đổi giá trị xã hội. Giá trị chỉ giảm khi công nghệ mới trở thành điều kiện sản xuất phổ biến.
>
> ## 8. Giá thị trường
>
> ```text
> MarketPriceVnd =
> Σ(TransactionPriceVnd × Quantity) / ΣQuantity
> ```
>
> Kết quả làm tròn tới 1.000 Đồng gần nhất khi hiển thị.
>
> Nếu không có giao dịch:
>
> - Không tạo giá thị trường giả.
> - Biểu đồ ghi “Không hình thành giá”.
> - Không sử dụng giá niêm yết thay cho giá giao dịch.
>
> Cung–cầu chỉ thay đổi điều kiện giao dịch và hành vi người chơi; hệ thống không tự tăng hoặc giảm giá.
>
> ## 9. Bốn vòng chuẩn
>
> 1. **Thị trường cơ sở:** cung và cầu bình thường; giá trị 10 nghìn Đồng.
> 2. **Được mùa:** sản lượng đưa ra thị trường tăng 50%, làm tròn lên; cầu và giá trị ngắn hạn không đổi.
> 3. **Thanh long viral:** nhu cầu tăng 50%, làm tròn lên; cung và giá trị không đổi.
> 4. **Công nghệ phổ biến:** năng suất xã hội tăng; giá trị giảm từ 10 xuống 6 nghìn Đồng.
>
> SRS phải giải thích rằng vòng hai giữ nguyên trục giá trị để cô lập tác động ngắn hạn của cung–cầu, không khẳng định cung–cầu tạo ra giá trị.
>
> ## 10. Cơ chế từng vai
>
> ### Người sản xuất
>
> - Nhận vốn bằng Đồng, hồ sơ năng suất và công suất.
> - Chọn sản lượng.
> - Chọn bán trực tiếp hoặc bán sỉ cho trung gian.
> - Niêm yết, chấp nhận, từ chối hoặc counter offer.
> - Có thể đầu tư nâng cấp công nghệ.
> - Hàng tồn bị hỏng cuối vòng nếu không có kho lạnh.
> - Kết quả dựa trên lợi nhuận, không chỉ doanh thu.
>
> ```text
> Lợi nhuận = Doanh thu - Chi phí sản xuất - Chi phí đầu tư
> ```
>
> ### Người tiêu dùng
>
> - Nhận ngân sách bằng Đồng và nhu cầu từng vòng.
> - Xem giá, nguồn bán và tồn kho.
> - Mua ngay hoặc trả giá.
> - Có tối đa một offer đang mở trên mỗi niêm yết.
> - Mua dư nhu cầu không tạo thêm điểm thỏa mãn.
>
> ```text
> Điểm tiêu dùng = Lợi ích thỏa mãn - Số tiền đã trả
> ```
>
> ### Trung gian
>
> - Nhận đề nghị bán sỉ.
> - Thương lượng và mua đứt hàng.
> - Thanh toán cho nhà sản xuất ngay.
> - Niêm yết lại và chịu rủi ro hàng tồn.
>
> ```text
> Lợi nhuận trung gian = Doanh thu bán lẻ - Chi phí mua sỉ
> ```
>
> ### Nhà nước
>
> - Xem dữ liệu tổng hợp.
> - Có ngân sách chính sách giới hạn bằng Đồng.
> - Chọn tối đa một chính sách mỗi vòng từ vòng hai:
>   - Công bố thông tin.
>   - Hỗ trợ kho lạnh.
>   - Xúc tiến xuất khẩu.
>   - Hỗ trợ công nghệ.
> - Không được trực tiếp đặt giá thị trường.
>
> Không có bảng xếp hạng chung; mỗi vai nhận danh hiệu riêng.
>
> ## 11. Giao dịch và tính toàn vẹn
>
> ```text
> Niêm yết → Mua ngay
> hoặc
> Niêm yết → Trả giá → Accept/Reject/Counter → Giao dịch
> ```
>
> Quy tắc:
>
> - Giá từ 1–30 nghìn Đồng.
> - Giá phải là bội số của 1.000 Đồng.
> - Không bán vượt tồn kho hoặc mua vượt số dư.
> - Giao dịch phải nguyên tử.
> - Hai người cùng mua đơn vị cuối: chỉ một người thành công.
> - Mỗi action có `clientActionId` chống gửi trùng.
> - Offer hết hạn khi vòng đóng.
> - Ví, kho, giao dịch và biểu đồ cập nhật trong cùng transaction.
> - Dữ liệu vòng đã chốt không được sửa.
>
> ## 12. UI/UX
>
> ### 12.1 Bản đồ chợ 2D
>
> Gồm:
>
> - Nông trại/Xưởng sản xuất.
> - Quầy bán trực tiếp.
> - Trung tâm phân phối.
> - Văn phòng Nhà nước.
> - Tháp quan sát thị trường.
>
> Avatar đứng cố định theo vai và hiển thị nickname, vai, trạng thái online/bot.
>
> ### 12.2 Màn hình
>
> 1. Đăng ký và đăng nhập.
> 2. Trang chủ và lịch sử.
> 3. Tạo/tham gia phòng.
> 4. Lobby và phân vai.
> 5. Host/projector view.
> 6. Bản đồ chợ.
> 7. Dashboard người sản xuất.
> 8. Khu mua hàng.
> 9. Dashboard trung gian.
> 10. Dashboard Nhà nước.
> 11. Dialog niêm yết, mua và trả giá.
> 12. Tổng kết vòng.
> 13. Báo cáo cuối phiên.
> 14. Hồ sơ và lịch sử.
>
> ### 12.3 Thành phần lý thuyết
>
> - Thẻ giá trị sử dụng và giá trị.
> - Thẻ hao phí cá biệt/TGLĐXHCT.
> - Ví **Đồng** và tooltip giải thích chức năng tiền tệ.
> - Đồng hồ cung–cầu.
> - Đồ thị “Giá trị” và “Giá thị trường”.
> - Bảng lợi nhuận nhà sản xuất.
> - Trung tâm phân phối.
> - Bảng chính sách.
> - Card “Vì sao xảy ra?” sau mỗi vòng.
>
> Mỗi số tiền hiển thị nhất quán:
>
> ```text
> 10 nghìn Đồng
> Tương đương: 10.000 Đồng
> ```
>
> Không sử dụng màu làm phương tiện phân biệt duy nhất.
>
> ## 13. Functional Requirements
>
> Các nhóm yêu cầu:
>
> - `FR-AUTH`: Google, email/mật khẩu, xác minh, reset và liên kết tài khoản.
> - `FR-PROFILE`: nickname, avatar, lịch sử và xóa tài khoản.
> - `FR-ROOM`: mã phòng, QR, ready và giới hạn 4–10.
> - `FR-HOST`: phân vai và điều khiển phiên.
> - `FR-GAME`: state machine, timer, bốn vòng và bot.
> - `FR-PRODUCER`
> - `FR-CONSUMER`
> - `FR-INTERMEDIARY`
> - `FR-STATE`
> - `FR-MARKET`: listing, buy, offer, counter và settlement.
> - `FR-ANALYTICS`: snapshot, đồ thị và debrief.
> - `FR-HISTORY`: lưu kết quả cá nhân và phiên host.
>
> Mỗi FR phải có actor, priority, tiền điều kiện, luồng chính, lỗi, hậu điều kiện, Theory ID và acceptance criteria.
>
> ## 14. Mô hình dữ liệu
>
> Đặc tả:
>
> - `User`
> - `AuthIdentity`
> - `Session`
> - `Participant`
> - `RoleAssignment`
> - `ScenarioConfig`
> - `Round`
> - `RoleState`
> - `Wallet`
> - `Inventory`
> - `Listing`
> - `Offer`
> - `Transaction`
> - `PolicyAction`
> - `MarketSnapshot`
> - `SessionResult`
> - `Badge`
>
> Tất cả trường tiền sử dụng hậu tố `Vnd`, ví dụ:
>
> - `balanceVnd`
> - `askPriceVnd`
> - `offerPriceVnd`
> - `transactionPriceVnd`
> - `unitValueVnd`
> - `policyCostVnd`
>
> ## 15. REST và WebSocket
>
> ### REST
>
> Dùng cho:
>
> - Xác thực và hồ sơ.
> - Tạo, tìm và tham gia phòng.
> - Lấy snapshot khi mở/reconnect.
> - Lấy lịch sử.
>
> ### WebSocket commands
>
> - `participant:ready`
> - `host:start|pause|resume|extend|next|end`
> - `producer:produce|list|wholesale|invest`
> - `consumer:buy|offer|accept_counter`
> - `intermediary:accept_wholesale|list|counter`
> - `government:apply_policy`
>
> ### Server events
>
> - `session:state`
> - `participant:presence`
> - `role:assigned`
> - `round:phase_changed`
> - `market:listing_updated`
> - `market:offer_updated`
> - `market:trade_completed`
> - `government:policy_applied`
> - `market:snapshot`
> - `session:ended`
> - `action:rejected`
>
> Mọi message mang `sessionId`, `actorId`, `roundId`, `timestamp` và `stateVersion`. Server là nguồn sự thật cho tiền, kho, giá và điểm.
>
> ## 16. Non-functional requirements
>
> - Mobile-first cho người chơi; desktop/projector cho host.
> - Event truyền tới toàn phòng trong tối đa 500 ms ở phân vị 95.
> - Reconnect bằng snapshot đầy đủ.
> - Mất kết nối 15 giây: bot tiếp quản.
> - Host mất kết nối: tự pause và chờ hai phút.
> - Hợp nhất Google/email theo email đã xác minh.
> - Không lưu mật khẩu dạng rõ.
> - Host không thấy email riêng tư của người chơi.
> - Client không được tự quyết định số dư, giá trị hoặc điểm.
> - Hỗ trợ Chrome/Edge desktop và Chrome/Safari mobile.
> - Các thao tác chính có nhãn hỗ trợ bàn phím và screen reader.
>
> ## 17. Kiểm thử
>
> ### Lý thuyết và tiền tệ
>
> - Giá trị mặc định: `2.000 + 2×4.000 = 10.000 Đồng`.
> - Giá trị vòng bốn: `2.000 + 1×4.000 = 6.000 Đồng`.
> - UI hiển thị tương ứng `10 nghìn Đồng` và `6 nghìn Đồng`.
> - Không còn chuỗi “Phi Coin” hoặc đơn vị “Phi”.
> - Giá trị, chi phí cá biệt và giá giao dịch không bị dùng lẫn.
> - Cung–cầu không trực tiếp ghi đè giá.
> - Không có giao dịch thì không tạo giá thị trường.
>
> ### Gameplay
>
> - Kiểm thử phân vai từ 4–10 người.
> - Không âm ví hoặc âm kho.
> - Giao dịch đồng thời xử lý nguyên tử.
> - Offer/counter hết hạn đúng.
> - Chính sách tuân thủ ngân sách.
> - Bot takeover không làm mất trạng thái.
> - Bốn vòng chạy đúng thứ tự.
>
> ### Xác thực và quyền
>
> - Google login.
> - Đăng ký email, xác minh và reset password.
> - Liên kết tài khoản trùng email.
> - Không gọi được action của vai khác.
> - Người ngoài phòng không nhận event.
>
> ### UI
>
> - Kiểm thử mobile, desktop và projector.
> - Kiểm tra loading, empty, error, timeout và reconnect.
> - Mọi số tiền định dạng nhất quán theo nghìn Đồng.
> - Đồ thị phân biệt rõ giá trị và giá thị trường.
> - Card giải thích dùng đúng dữ liệu và trang slide.
>
> ## 18. Kiểm tra chất lượng file SRS
>
> - Mọi ID phải duy nhất.
> - Mọi FR/BR/UI phải có source basis.
> - Mọi Theory ID phải trỏ đúng trang PDF.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Phân biệt rõ Host, Nhà nước và bot.
> - Kiểm tra Mermaid và bảng Markdown.
> - Tìm toàn file để bảo đảm không còn `Phi Coin`, `PhiCoin` hoặc tiền mô phỏng “Phi”.
> - Quy ước cuối cùng phải thống nhất: tiền tệ là **Đồng**, gameplay trình bày theo **nghìn Đồng**, dữ liệu lưu bằng số nguyên VND.

</details>

> PLEASE IMPLEMENT THIS PLAN:
>
> # Kế hoạch viết lại SRS “Phiên chợ giá trị Online”
>
> ## 1. Mục tiêu bản SRS mới
>
> Viết lại toàn bộ `SRS MLN122.md` thành đặc tả đủ để triển khai web app multiplayer mà không phải tự quyết định thêm về luật chơi, UI, dữ liệu hay hành vi realtime.
>
> Các quyết định đã khóa:
>
> - Phiên chợ online đồng bộ, host điều phối.
> - 4–10 người chơi; host không tính vào số ghế.
> - Một hàng hóa duy nhất: thùng thanh long.
> - Bản đồ chợ 2D tĩnh, avatar không di chuyển tự do.
> - Bốn vai: người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Bot đảm nhiệm vai còn thiếu hoặc tạm tiếp quản người mất kết nối.
> - Giao dịch bằng **Đồng Việt Nam**, không sử dụng tiền “Phi”.
> - Để dễ tính, gameplay dùng thang **nghìn Đồng**: `10 nghìn Đồng = 10.000 Đồng`.
> - Giao dịch theo cơ chế niêm yết, mua ngay và trả giá.
> - Kịch bản chuẩn gồm bốn vòng, kéo dài 15–20 phút.
> - Có tài khoản bằng Google hoặc email/mật khẩu.
> - Lưu hồ sơ và lịch sử phiên; không có quiz.
> - Kiến trúc trung lập, dùng REST và WebSocket.
>
> ## 2. Cấu trúc SRS
>
> ### 2.1 Quản lý tài liệu
>
> Bổ sung:
>
> - Phiên bản, ngày cập nhật và trạng thái SRS.
> - Mục đích, đối tượng đọc và tài liệu nguồn.
> - Quy ước mã: `LT`, `LO`, `FR`, `BR`, `UI`, `NFR`, `AC`.
> - Ghi rõ số trang trích dẫn là số trang PDF của `MLN122_Chuong2_Sum26.pdf`.
>
> ### 2.2 Phạm vi
>
> Trong phạm vi:
>
> - Đăng ký, đăng nhập và hồ sơ.
> - Tạo phòng, tham gia bằng mã phòng và phân vai.
> - Phiên chơi realtime bốn vòng.
> - Sản xuất, mua bán, trung gian, chính sách và bot.
> - Biểu đồ giá trị–giá cả và tổng kết.
> - Lịch sử cá nhân và lịch sử phiên của host.
>
> Ngoài phạm vi:
>
> - Nhiều loại hàng hóa.
> - Bản đồ di chuyển tự do.
> - Chat và voice chat.
> - Tự tạo biến cố hoặc chỉnh công thức kinh tế.
> - Quiz và bảng xếp hạng chung.
> - Chế độ chơi cá nhân.
> - Trang quản trị riêng.
>
> ## 3. Hệ thống truy vết lý thuyết
>
> | ID    | Nội dung                                          | Trang PDF |
> | ----- | ------------------------------------------------- | --------: |
> | LT-01 | Khái niệm hàng hóa                                |        11 |
> | LT-02 | Giá trị sử dụng và giá trị                        |     12–17 |
> | LT-03 | Lao động cụ thể, lao động trừu tượng              |     24–28 |
> | LT-04 | Thời gian lao động xã hội cần thiết               |     30–31 |
> | LT-05 | Cấu thành giá trị, năng suất và cường độ lao động |     32–36 |
> | LT-06 | Tiền là thước đo giá trị và phương tiện lưu thông |     50–53 |
> | LT-07 | Khái niệm, vai trò và cơ chế thị trường           |     66–69 |
> | LT-08 | Khuyết tật thị trường và vai trò Nhà nước         |     71–76 |
> | LT-09 | Nội dung, cơ chế quy luật giá trị                 |     81–82 |
> | LT-10 | Ba tác động của quy luật giá trị                  |     83–85 |
> | LT-11 | Quy luật cung–cầu                                 |        86 |
> | LT-12 | Quy luật cạnh tranh                               |        88 |
> | LT-13 | Bốn chủ thể thị trường                            |     89–90 |
> | LT-14 | Tình huống “được mùa–mất giá”                     |    91, 94 |
>
> Mỗi cơ chế và thành phần UI phải nêu:
>
> - Cơ sở lý thuyết.
> - Suy luận sản phẩm.
> - Biểu hiện trong gameplay.
> - Biểu hiện trên UI.
> - Requirement và acceptance criteria liên quan.
>
> Các yêu cầu thuần kỹ thuật dùng nguồn `TECH/UX`, không gán giả tạo cho slide.
>
> ## 4. Vòng đời phiên chơi
>
> ```text
> CREATED → LOBBY → INTRO
> → ROUND_1 → ROUND_2 → ROUND_3 → ROUND_4
> → DEBRIEF → COMPLETED
> ```
>
> Mỗi vòng:
>
> 1. Công bố biến cố: 15 giây.
> 2. Quyết định sản xuất/chính sách: 45 giây.
> 3. Mở chợ: 60 giây.
> 4. Chốt sổ và giải thích: 30 giây.
>
> Host được start, pause, resume, gia hạn 30 giây, chuyển vòng và kết thúc; không được sửa công thức hoặc thứ tự biến cố.
>
> ## 5. Phân bổ vai
>
> | Người chơi | Sản xuất | Tiêu dùng | Trung gian | Nhà nước |
> | ---------: | -------: | --------: | ---------: | -------: |
> |          4 |        2 |         2 |        Bot |      Bot |
> |          5 |        2 |         2 |          1 |      Bot |
> |          6 |        2 |         2 |          1 |        1 |
> |          7 |        3 |         2 |          1 |        1 |
> |          8 |        3 |         3 |          1 |        1 |
> |          9 |        4 |         3 |          1 |        1 |
> |         10 |        4 |         4 |          1 |        1 |
>
> Hệ thống tự phân bổ; host được đổi vai trước vòng một. Sau khi bắt đầu, vai chỉ thay đổi khi bot takeover.
>
> ## 6. Tiền tệ và biểu diễn giá
>
> ### 6.1 Quy ước
>
> - Tiền tệ chính thức: **Đồng Việt Nam – VND**.
> - Gameplay hiển thị theo **nghìn Đồng** để số liệu ngắn và dễ tính.
> - Ví dụ: `10 nghìn Đồng`, tương đương `10.000 Đồng`.
> - Tooltip hoặc màn hình chi tiết hiển thị giá trị đầy đủ bằng Đồng.
> - Không sử dụng tên “Phi Coin”, ký hiệu “Phi” hoặc tiền hư cấu.
>
> ### 6.2 Lưu trữ kỹ thuật
>
> Tiền được lưu bằng số nguyên Đồng:
>
> ```text
> 10 nghìn Đồng → amountVnd = 10000
> 6 nghìn Đồng  → amountVnd = 6000
> ```
>
> Quy tắc:
>
> - Không lưu tiền bằng số thực.
> - Mọi giá trong gameplay là bội số của 1.000 Đồng.
> - API và WebSocket truyền `amountVnd`.
> - UI chịu trách nhiệm định dạng thành `10 nghìn Đồng` hoặc `10.000 Đồng`.
>
> Cơ sở: tiền biểu hiện giá trị và làm phương tiện lưu thông (`LT-06`, trang 50–53).
>
> ## 7. Cơ chế giá trị
>
> Mô hình giản lược:
>
> ```text
> Giá trị đơn vị = c + TGLĐXHCT × hệ số lao động
> ```
>
> Mặc định:
>
> - Giá trị đầu vào chuyển dịch `c = 2 nghìn Đồng`.
> - Hệ số lao động `= 4 nghìn Đồng/đơn vị thời gian`.
> - Vòng 1–3: TGLĐXHCT = 2.
> - Giá trị xã hội = `2 + 2×4 = 10 nghìn Đồng`.
> - Vòng 4: TGLĐXHCT giảm còn 1.
> - Giá trị xã hội mới = `2 + 1×4 = 6 nghìn Đồng`.
>
> Công thức lưu trữ:
>
> ```text
> unitValueVnd = 2000 + socialLaborTime × 4000
> ```
>
> Chi phí cá biệt:
>
> | Hồ sơ             | Thời gian cá biệt | Chi phí cá biệt |
> | ----------------- | ----------------: | --------------: |
> | Truyền thống      |                 4 |   18 nghìn Đồng |
> | Trung bình xã hội |                 2 |   10 nghìn Đồng |
> | Tiên phong        |                 1 |    6 nghìn Đồng |
>
> SRS phải phân biệt:
>
> - Giá trị xã hội.
> - Hao phí và chi phí cá biệt.
> - Giá niêm yết.
> - Giá giao dịch.
> - Giá thị trường của vòng.
>
> Một người cải tiến chưa làm thay đổi giá trị xã hội. Giá trị chỉ giảm khi công nghệ mới trở thành điều kiện sản xuất phổ biến.
>
> ## 8. Giá thị trường
>
> ```text
> MarketPriceVnd =
> Σ(TransactionPriceVnd × Quantity) / ΣQuantity
> ```
>
> Kết quả làm tròn tới 1.000 Đồng gần nhất khi hiển thị.
>
> Nếu không có giao dịch:
>
> - Không tạo giá thị trường giả.
> - Biểu đồ ghi “Không hình thành giá”.
> - Không sử dụng giá niêm yết thay cho giá giao dịch.
>
> Cung–cầu chỉ thay đổi điều kiện giao dịch và hành vi người chơi; hệ thống không tự tăng hoặc giảm giá.
>
> ## 9. Bốn vòng chuẩn
>
> 1. **Thị trường cơ sở:** cung và cầu bình thường; giá trị 10 nghìn Đồng.
> 2. **Được mùa:** sản lượng đưa ra thị trường tăng 50%, làm tròn lên; cầu và giá trị ngắn hạn không đổi.
> 3. **Thanh long viral:** nhu cầu tăng 50%, làm tròn lên; cung và giá trị không đổi.
> 4. **Công nghệ phổ biến:** năng suất xã hội tăng; giá trị giảm từ 10 xuống 6 nghìn Đồng.
>
> SRS phải giải thích rằng vòng hai giữ nguyên trục giá trị để cô lập tác động ngắn hạn của cung–cầu, không khẳng định cung–cầu tạo ra giá trị.
>
> ## 10. Cơ chế từng vai
>
> ### Người sản xuất
>
> - Nhận vốn bằng Đồng, hồ sơ năng suất và công suất.
> - Chọn sản lượng.
> - Chọn bán trực tiếp hoặc bán sỉ cho trung gian.
> - Niêm yết, chấp nhận, từ chối hoặc counter offer.
> - Có thể đầu tư nâng cấp công nghệ.
> - Hàng tồn bị hỏng cuối vòng nếu không có kho lạnh.
> - Kết quả dựa trên lợi nhuận, không chỉ doanh thu.
>
> ```text
> Lợi nhuận = Doanh thu - Chi phí sản xuất - Chi phí đầu tư
> ```
>
> ### Người tiêu dùng
>
> - Nhận ngân sách bằng Đồng và nhu cầu từng vòng.
> - Xem giá, nguồn bán và tồn kho.
> - Mua ngay hoặc trả giá.
> - Có tối đa một offer đang mở trên mỗi niêm yết.
> - Mua dư nhu cầu không tạo thêm điểm thỏa mãn.
>
> ```text
> Điểm tiêu dùng = Lợi ích thỏa mãn - Số tiền đã trả
> ```
>
> ### Trung gian
>
> - Nhận đề nghị bán sỉ.
> - Thương lượng và mua đứt hàng.
> - Thanh toán cho nhà sản xuất ngay.
> - Niêm yết lại và chịu rủi ro hàng tồn.
>
> ```text
> Lợi nhuận trung gian = Doanh thu bán lẻ - Chi phí mua sỉ
> ```
>
> ### Nhà nước
>
> - Xem dữ liệu tổng hợp.
> - Có ngân sách chính sách giới hạn bằng Đồng.
> - Chọn tối đa một chính sách mỗi vòng từ vòng hai:
>   - Công bố thông tin.
>   - Hỗ trợ kho lạnh.
>   - Xúc tiến xuất khẩu.
>   - Hỗ trợ công nghệ.
> - Không được trực tiếp đặt giá thị trường.
>
> Không có bảng xếp hạng chung; mỗi vai nhận danh hiệu riêng.
>
> ## 11. Giao dịch và tính toàn vẹn
>
> ```text
> Niêm yết → Mua ngay
> hoặc
> Niêm yết → Trả giá → Accept/Reject/Counter → Giao dịch
> ```
>
> Quy tắc:
>
> - Giá từ 1–30 nghìn Đồng.
> - Giá phải là bội số của 1.000 Đồng.
> - Không bán vượt tồn kho hoặc mua vượt số dư.
> - Giao dịch phải nguyên tử.
> - Hai người cùng mua đơn vị cuối: chỉ một người thành công.
> - Mỗi action có `clientActionId` chống gửi trùng.
> - Offer hết hạn khi vòng đóng.
> - Ví, kho, giao dịch và biểu đồ cập nhật trong cùng transaction.
> - Dữ liệu vòng đã chốt không được sửa.
>
> ## 12. UI/UX
>
> ### 12.1 Bản đồ chợ 2D
>
> Gồm:
>
> - Nông trại/Xưởng sản xuất.
> - Quầy bán trực tiếp.
> - Trung tâm phân phối.
> - Văn phòng Nhà nước.
> - Tháp quan sát thị trường.
>
> Avatar đứng cố định theo vai và hiển thị nickname, vai, trạng thái online/bot.
>
> ### 12.2 Màn hình
>
> 1. Đăng ký và đăng nhập.
> 2. Trang chủ và lịch sử.
> 3. Tạo/tham gia phòng.
> 4. Lobby và phân vai.
> 5. Host/projector view.
> 6. Bản đồ chợ.
> 7. Dashboard người sản xuất.
> 8. Khu mua hàng.
> 9. Dashboard trung gian.
> 10. Dashboard Nhà nước.
> 11. Dialog niêm yết, mua và trả giá.
> 12. Tổng kết vòng.
> 13. Báo cáo cuối phiên.
> 14. Hồ sơ và lịch sử.
>
> ### 12.3 Thành phần lý thuyết
>
> - Thẻ giá trị sử dụng và giá trị.
> - Thẻ hao phí cá biệt/TGLĐXHCT.
> - Ví **Đồng** và tooltip giải thích chức năng tiền tệ.
> - Đồng hồ cung–cầu.
> - Đồ thị “Giá trị” và “Giá thị trường”.
> - Bảng lợi nhuận nhà sản xuất.
> - Trung tâm phân phối.
> - Bảng chính sách.
> - Card “Vì sao xảy ra?” sau mỗi vòng.
>
> Mỗi số tiền hiển thị nhất quán:
>
> ```text
> 10 nghìn Đồng
> Tương đương: 10.000 Đồng
> ```
>
> Không sử dụng màu làm phương tiện phân biệt duy nhất.
>
> ## 13. Functional Requirements
>
> Các nhóm yêu cầu:
>
> - `FR-AUTH`: Google, email/mật khẩu, xác minh, reset và liên kết tài khoản.
> - `FR-PROFILE`: nickname, avatar, lịch sử và xóa tài khoản.
> - `FR-ROOM`: mã phòng, QR, ready và giới hạn 4–10.
> - `FR-HOST`: phân vai và điều khiển phiên.
> - `FR-GAME`: state machine, timer, bốn vòng và bot.
> - `FR-PRODUCER`
> - `FR-CONSUMER`
> - `FR-INTERMEDIARY`
> - `FR-STATE`
> - `FR-MARKET`: listing, buy, offer, counter và settlement.
> - `FR-ANALYTICS`: snapshot, đồ thị và debrief.
> - `FR-HISTORY`: lưu kết quả cá nhân và phiên host.
>
> Mỗi FR phải có actor, priority, tiền điều kiện, luồng chính, lỗi, hậu điều kiện, Theory ID và acceptance criteria.
>
> ## 14. Mô hình dữ liệu
>
> Đặc tả:
>
> - `User`
> - `AuthIdentity`
> - `Session`
> - `Participant`
> - `RoleAssignment`
> - `ScenarioConfig`
> - `Round`
> - `RoleState`
> - `Wallet`
> - `Inventory`
> - `Listing`
> - `Offer`
> - `Transaction`
> - `PolicyAction`
> - `MarketSnapshot`
> - `SessionResult`
> - `Badge`
>
> Tất cả trường tiền sử dụng hậu tố `Vnd`, ví dụ:
>
> - `balanceVnd`
> - `askPriceVnd`
> - `offerPriceVnd`
> - `transactionPriceVnd`
> - `unitValueVnd`
> - `policyCostVnd`
>
> ## 15. REST và WebSocket
>
> ### REST
>
> Dùng cho:
>
> - Xác thực và hồ sơ.
> - Tạo, tìm và tham gia phòng.
> - Lấy snapshot khi mở/reconnect.
> - Lấy lịch sử.
>
> ### WebSocket commands
>
> - `participant:ready`
> - `host:start|pause|resume|extend|next|end`
> - `producer:produce|list|wholesale|invest`
> - `consumer:buy|offer|accept_counter`
> - `intermediary:accept_wholesale|list|counter`
> - `government:apply_policy`
>
> ### Server events
>
> - `session:state`
> - `participant:presence`
> - `role:assigned`
> - `round:phase_changed`
> - `market:listing_updated`
> - `market:offer_updated`
> - `market:trade_completed`
> - `government:policy_applied`
> - `market:snapshot`
> - `session:ended`
> - `action:rejected`
>
> Mọi message mang `sessionId`, `actorId`, `roundId`, `timestamp` và `stateVersion`. Server là nguồn sự thật cho tiền, kho, giá và điểm.
>
> ## 16. Non-functional requirements
>
> - Mobile-first cho người chơi; desktop/projector cho host.
> - Event truyền tới toàn phòng trong tối đa 500 ms ở phân vị 95.
> - Reconnect bằng snapshot đầy đủ.
> - Mất kết nối 15 giây: bot tiếp quản.
> - Host mất kết nối: tự pause và chờ hai phút.
> - Hợp nhất Google/email theo email đã xác minh.
> - Không lưu mật khẩu dạng rõ.
> - Host không thấy email riêng tư của người chơi.
> - Client không được tự quyết định số dư, giá trị hoặc điểm.
> - Hỗ trợ Chrome/Edge desktop và Chrome/Safari mobile.
> - Các thao tác chính có nhãn hỗ trợ bàn phím và screen reader.
>
> ## 17. Kiểm thử
>
> ### Lý thuyết và tiền tệ
>
> - Giá trị mặc định: `2.000 + 2×4.000 = 10.000 Đồng`.
> - Giá trị vòng bốn: `2.000 + 1×4.000 = 6.000 Đồng`.
> - UI hiển thị tương ứng `10 nghìn Đồng` và `6 nghìn Đồng`.
> - Không còn chuỗi “Phi Coin” hoặc đơn vị “Phi”.
> - Giá trị, chi phí cá biệt và giá giao dịch không bị dùng lẫn.
> - Cung–cầu không trực tiếp ghi đè giá.
> - Không có giao dịch thì không tạo giá thị trường.
>
> ### Gameplay
>
> - Kiểm thử phân vai từ 4–10 người.
> - Không âm ví hoặc âm kho.
> - Giao dịch đồng thời xử lý nguyên tử.
> - Offer/counter hết hạn đúng.
> - Chính sách tuân thủ ngân sách.
> - Bot takeover không làm mất trạng thái.
> - Bốn vòng chạy đúng thứ tự.
>
> ### Xác thực và quyền
>
> - Google login.
> - Đăng ký email, xác minh và reset password.
> - Liên kết tài khoản trùng email.
> - Không gọi được action của vai khác.
> - Người ngoài phòng không nhận event.
>
> ### UI
>
> - Kiểm thử mobile, desktop và projector.
> - Kiểm tra loading, empty, error, timeout và reconnect.
> - Mọi số tiền định dạng nhất quán theo nghìn Đồng.
> - Đồ thị phân biệt rõ giá trị và giá thị trường.
> - Card giải thích dùng đúng dữ liệu và trang slide.
>
> ## 18. Kiểm tra chất lượng file SRS
>
> - Mọi ID phải duy nhất.
> - Mọi FR/BR/UI phải có source basis.
> - Mọi Theory ID phải trỏ đúng trang PDF.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Phân biệt rõ Host, Nhà nước và bot.
> - Kiểm tra Mermaid và bảng Markdown.
> - Tìm toàn file để bảo đảm không còn `Phi Coin`, `PhiCoin` hoặc tiền mô phỏng “Phi”.
> - Quy ước cuối cùng phải thống nhất: tiền tệ là **Đồng**, gameplay trình bày theo **nghìn Đồng**, dữ liệu lưu bằng số nguyên VND.

<details><summary>9 previous messages</summary>

> Mình sẽ thay toàn bộ bản SRS khung bằng đặc tả triển khai đầy đủ: truy vết slide, luật chơi, UI, FR/BR, mô hình dữ liệu, REST/WebSocket và bộ tiêu chí nghiệm thu. Sau đó mình sẽ kiểm tra tự động ID trùng, thuật ngữ tiền tệ và các tham chiếu lý thuyết.
>
> <details><summary>Ran a command</summary>
>
> - Ran `Get-Item 'SRS MLN122.md' | Select-Object FullName,Length,LastWriteTime; (Get-Content 'SRS MLN122.md').Count; rg -n '^#{1,6} ' 'SRS MLN122.md'`
>
> </details>
>
> Khung nghiệp vụ đã được khóa. Mình đang viết phần khó nhất: các công thức và giao dịch phải đủ chính xác để code, nhưng vẫn tách đúng “giá trị”, “chi phí cá biệt”, “giá niêm yết” và “giá thị trường”—đây là chỗ SRS cũ còn nhập làm một.
>
> <details><summary>Created a file, ran a command</summary>
>
> - Wrote `./SRS MLN122.md` (+1155 -0)
> - Ran `Get-Item 'SRS MLN122.md' | Select-Object Length,LastWriteTime; (Get-Content 'SRS MLN122.md').Count; rg -n '^#{1,6} ' 'SRS MLN122.md' | Select-Object -First 80`
>
> </details>
>
> Bản viết lại đã thành 1.155 dòng. Mình đang chạy vòng kiểm tra tài liệu: thuật ngữ tiền tệ, tính duy nhất của FR/BR/NFR/TC, sự hiện diện của acceptance criteria và tính cân đối của các code fence/bảng Markdown.
>
> <details><summary>Edited a file, ran 8 commands</summary>
>
> - Ran ````$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
>   from pathlib import Path
>   import re
>   p=Path('SRS MLN122.md')
>   t=p.read_text(encoding='utf-8')
>   lines=t.splitlines()
>   print('chars',len(t),'lines',len(lines))
>   for pat in [r'Phi Coin',r'PhiCoin',r'tiền\s+(?:mô phỏng\s+)?[“"]?Phi\b',r'đơn vị tiền[^\n]\*\bPhi\b']:
>   hits=[(i+1,l) for i,l in enumerate(lines) if re.search(pat,l,re.I)]
>   print('forbidden',pat,'hits',len(hits))
>   for x in hits[:5]: print(' ',x)
>
> def first_col(prefix):
> rx=re.compile(r'^\| `('+re.escape(prefix)+r'[^`]+)` \|')
    out=[]
    for i,l in enumerate(lines,1):
        m=rx.match(l)
        if m: out.append((m.group(1),i,l))
    return out
for prefix in ['FR-','BR-','NFR-','TC-','UI-','LT-']:
    rows=first_col(prefix)
    by={}
    for ident,ln,l in rows: by.setdefault(ident,[]).append(ln)
    dup={k:v for k,v in by.items() if len(v)>1}
    print(prefix,'definition_rows',len(rows),'unique',len(by),'duplicates',dup)
fr=first_col('FR-')
missing_ac=[(ident,ln) for ident,ln,l in fr if 'AC-' not in l]
missing_basis=[(ident,ln) for ident,ln,l in fr if not any(x in l for x in ['`LT-','`UX-','`TECH-'])]
> print('FR missing AC',missing_ac)
> print('FR missing basis',missing_basis)
> print('fences',sum(1 for l in lines if l.startswith('`')),'mermaid',t.count('`mermaid'))
> print('LT IDs',sorted({x[0] for x in first_col('LT-')}))
>
> # Basic markdown table consistency by contiguous row pipe counts.
>
> issues=[]
> in_table=False
> expected=None
> for i,l in enumerate(lines,1):
> if l.startswith('|') and l.endswith('|'):
> count=l.count('|')
> if not in_table:
> in_table=True; expected=count
> elif count!=expected:
> issues.append((i,expected,count,l[:100]))
> else:
> in_table=False; expected=None
> print('table pipe issues',len(issues))
> for x in issues[:20]: print(' ',x)
> '@ | & $py -````
>
> - Ran ``$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pathlib import Path
import re
s=Path('SRS MLN122.md').read_text(encoding='utf-8')
for prefix in ['UX-','TECH-','AC-','LO-']:
    ids=sorted(set(re.findall(r'`('+prefix+r'[A-Z0-9-]+)`',s)))
    print(prefix,len(ids))
    print(' '.join(ids))
'@ | & $py -``
> - Wrote `./SRS MLN122.md` (+43 -4)
> - Wrote `./SRS MLN122.md` (+13 -8)
> - Ran ````$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
>   from pathlib import Path
>   import re, collections
>   p=Path('SRS MLN122.md')
>   s=p.read_text(encoding='utf-8')
>   lines=s.splitlines()
>   print('chars',len(s),'lines',len(lines),'bytes',p.stat().st_size)
>   patterns={
>   'exact Phi Coin':r'Phi Coin',
>   'exact PhiCoin':r'PhiCoin',
>   'currency Phi':r'(?:tiền|đơn vị tiền)[^\n|]{0,40}\bPhi\b',
>   'rawMarketPrice':r'rawMarketPrice',
>   }
>   for name,pat in patterns.items():
>   hits=[i+1 for i,l in enumerate(lines) if re.search(pat,l,re.I)]
>   print(name,hits)
>
> def defs(prefix):
> rx=re.compile(r'^\| `('+re.escape(prefix)+r'[^`]+)` \|')
    out=[]
    for i,l in enumerate(lines,1):
        m=rx.match(l)
        if m: out.append((m.group(1),i,l))
    return out
for prefix in ['LT-','UX-','TECH-','FR-','BR-','UI-','NFR-','TC-']:
    rows=defs(prefix); c=collections.Counter(x[0] for x in rows)
    print(prefix,'defs',len(rows),'unique',len(c),'dups',{k:v for k,v in c.items() if v>1})
for prefix in ['LT-','UX-','TECH-','FR-','BR-','UI-','NFR-','LO-']:
    all_refs=set(re.findall(r'`('+prefix+r'[A-Z0-9-]+)`',s))
    defined={x[0] for x in defs(prefix)}
    if prefix=='LO-':
        rx=re.compile(r'^\| `('+re.escape(prefix)+r'[^`]+)` \|')
        defined={m.group(1) for l in lines if (m:=rx.match(l))}
    unresolved=sorted(all_refs-defined)
    print(prefix,'refs',len(all_refs),'unresolved',unresolved)
fr=defs('FR-')
acs=[]
for ident,ln,l in fr:
    found=re.findall(r'`(AC-[A-Z0-9-]+)`',l)
> if len(found)!=1: print('bad AC count',ident,ln,found)
> acs.extend(found)
> print('FR',len(fr),'AC',len(acs),'uniqueAC',len(set(acs)),'duplicateAC',[k for k,v in collections.Counter(acs).items() if v>1])
> print('fence lines',sum(1 for l in lines if l.startswith('`')),'mermaid',s.count('`mermaid'))
>
> # Table consistency
>
> issues=[]; in_table=False; expected=0
> for i,l in enumerate(lines,1):
> if l.startswith('|') and l.endswith('|'):
> pc=l.count('|')
> if not in_table: in_table=True; expected=pc
> elif pc!=expected: issues.append((i,expected,pc))
> else: in_table=False
> print('table issues',issues[:20], 'count',len(issues))
>
> # Required headings/phrases
>
> for phrase in ['## 8. Functional requirements','## 10. Mô hình dữ liệu logic','## 11. REST interface','## 12. WebSocket contract','## 17. Kế hoạch kiểm thử và acceptance','## 18. Ma trận truy vết tổng hợp']:
> print('required',phrase, phrase in s)
> '@ | & $py -````
>
> - Ran `$lines=Get-Content 'SRS MLN122.md'; $lines[130..140]; rg -n 'UI-MARKET-03' 'SRS MLN122.md'`
> - Wrote `./SRS MLN122.md` (+2 -2)
> - Ran `$git='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'; if (Test-Path '.git') { & $git diff --check -- 'SRS MLN122.md'; & $git status --short -- 'SRS MLN122.md' } else { Write-Output 'NO_GIT_REPOSITORY' }; rg -n 'Phi Coin|PhiCoin|tiền hư cấu “Phi”|đơn vị tiền “Phi”|rawMarketPrice|UI-MARKET-03' 'SRS MLN122.md'; rg -n 'Đồng|VND' 'SRS MLN122.md' | Measure-Object | Select-Object Count`
> - Ran `$git='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'; & $git status --short; & $git diff --stat -- 'SRS MLN122.md'; & $git diff --numstat -- 'SRS MLN122.md'`
> - Ran `$mods='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; Get-ChildItem $mods -Directory -Filter 'markdown*' | Select-Object Name,FullName; Get-ChildItem $mods -Recurse -Directory -Filter 'markdown-it' -ErrorAction SilentlyContinue | Select-Object -First 5 FullName`
> - Ran `$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
mods=['markdown','markdown_it','mistune','commonmark']
for m in mods:
 try:
  x=__import__(m); print(m,'OK',getattr(x,'__version__',''))
 except Exception as e: print(m,'NO')
'@ | & $py -`
> - Wrote `./SRS MLN122.md` (+4 -4)
> - Wrote `./SRS MLN122.md` (+2 -0)
>
> </details>
>
> Phần mô phỏng đã được rà lại thêm một lượt: vòng “được mùa” giờ tăng cả nguồn lực và trần cung ứng 50% nhưng giữ nguyên chi phí/giá trị đơn vị; công thức điểm người tiêu dùng cũng đã sửa để mua dư vẫn bị trừ toàn bộ chi tiêu. Mình đang chạy kiểm tra cuối trước khi bàn giao.
>
> <details><summary>Ran a command</summary>
>
> - Ran ````$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
>   from pathlib import Path
>   import re, json, collections, sys
>   p=Path('SRS MLN122.md')
>   s=p.read_text(encoding='utf-8')
>   lines=s.splitlines()
>   errors=[]
>
> def defs(prefix):
> rx=re.compile(r'^\| `('+re.escape(prefix)+r'[^`]+)` \|')
    return [(m.group(1),i,l) for i,l in enumerate(lines,1) if (m:=rx.match(l))]
for pat in [r'Phi Coin',r'PhiCoin',r'(?:tiền|đơn vị tiền)[^\n|]{0,40}[“"`]?Phi\b',r'rawMarketPrice']:
> hits=[i+1 for i,l in enumerate(lines) if re.search(pat,l,re.I)]
> if hits: errors.append(f'forbidden {pat}: {hits}')
> for prefix in ['LT-','UX-','TECH-','FR-','BR-','UI-','NFR-','TC-']:
> rows=defs(prefix); c=collections.Counter(x[0] for x in rows)
> dup={k:v for k,v in c.items() if v>1}
> if dup: errors.append(f'duplicate defs {prefix}: {dup}')
> for prefix in ['LT-','UX-','TECH-','FR-','BR-','UI-','NFR-','LO-']:
> refs=set(re.findall(r'`('+prefix+r'[A-Z0-9-]+)`',s))
> known={x[0] for x in defs(prefix)}
> missing=refs-known
> if missing: errors.append(f'unresolved {prefix}: {sorted(missing)}')
> fr=defs('FR-'); acs=[]
> for ident,ln,l in fr:
> found=re.findall(r'`(AC-[A-Z0-9-]+)`',l)
> if len(found)!=1: errors.append(f'{ident} AC count {len(found)} at {ln}')
> if not any(x in l for x in ['`LT-','`UX-','`TECH-']): errors.append(f'{ident} missing basis at {ln}')
> acs.extend(found)
> if len(set(acs))!=len(acs): errors.append('duplicate AC IDs')
> if sum(1 for l in lines if l.startswith('```'))%2: errors.append('unbalanced code fences')
>
> # Parse JSON code blocks.
>
> for idx,block in enumerate(re.findall(r'`json\n(.*?)\n`',s,re.S),1):
> try: json.loads(block)
> except Exception as e: errors.append(f'json block {idx}: {e}')
>
> # Check markdown table pipe count per contiguous table.
>
> in_table=False; expected=None
> for i,l in enumerate(lines,1):
> if l.startswith('|') and l.endswith('|'):
> pc=l.count('|')
> if not in_table: in_table=True; expected=pc
> elif pc!=expected: errors.append(f'table pipe mismatch line {i}: {pc}!={expected}')
> else: in_table=False; expected=None
>
> # Required definitions and theory IDs.
>
> expected_lt={f'LT-{i:02d}' for i in range(1,15)}
> if {x[0] for x in defs('LT-')}!=expected_lt: errors.append('LT catalog incomplete')
> print('VALIDATION', 'PASS' if not errors else 'FAIL')
> for e in errors: print('ERROR',e)
> print('lines',len(lines),'chars',len(s),'bytes',p.stat().st_size)
> print('definitions', {k:len(defs(k)) for k in ['LT-','UX-','TECH-','FR-','BR-','UI-','NFR-','TC-']})
> print('acceptance_criteria',len(acs),'unique',len(set(acs)))
> print('code_fences',sum(1 for l in lines if l.startswith('`')),'mermaid_blocks',s.count('`mermaid'),'json_blocks',s.count('```json'))
> sys.exit(1 if errors else 0)
> '@ | & $py -; $git='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'; & $git diff --check -- 'SRS MLN122.md'````
>
> </details>
>
> <details><summary>Plan</summary>
>
> SRS đã được viết lại và vượt qua kiểm tra tự động: không có ID trùng/thiếu tham chiếu, mọi FR có AC và cơ sở, bảng/code fence hợp lệ, tiền tệ thống nhất VND.
>
> - [x] Đối chiếu file SRS hiện tại và cấu trúc nguồn
> - [x] Viết lại SRS theo đặc tả đã chốt
> - [x] Kiểm tra truy vết, ID, thuật ngữ và Markdown
>
> </details>

</details>

Đã viết lại hoàn chỉnh `SRS MLN122.md`.

Bản mới gồm 1.201 dòng với:

- 14 cơ sở lý thuyết truy vết theo slide.
- 72 FR kèm 72 acceptance criteria.
- Luật chơi, bốn vai và bot.
- UI/UX, dữ liệu, REST và WebSocket.
- 26 business rules, 17 NFR và 10 test case.
- Tiền tệ thống nhất VND, hiển thị theo nghìn Đồng.
- Ba sơ đồ Mermaid.

Kiểm tra tự động đã pass: không trùng ID, không thiếu tham chiếu, bảng/code fence hợp lệ và không còn đơn vị tiền hư cấu.

> User Interaction Document (UID) là gì

User Interaction Document (UID) là tài liệu mô tả chi tiết cách người dùng tương tác với hệ thống.

Nếu SRS trả lời **“Hệ thống phải làm gì?”**, thì UID trả lời **“Người dùng sẽ sử dụng nó như thế nào?”**

UID thường bao gồm:

- Các nhóm người dùng và mục tiêu của họ.
- User flow từ đăng nhập đến hoàn thành nhiệm vụ.
- Danh sách màn hình và chức năng từng màn hình.
- Hành động như click, nhập liệu, kéo thả, xác nhận.
- Phản hồi của hệ thống sau mỗi hành động.
- Trạng thái loading, rỗng, lỗi, mất kết nối và thành công.
- Quy tắc điều hướng.
- Wireframe hoặc mô tả bố cục.
- Nội dung text, tooltip và thông báo.
- Yêu cầu responsive và accessibility.

Với **Phiên chợ giá trị Online**, UID sẽ mô tả cụ thể:

```text
Đăng nhập → Tạo/Tham gia phòng → Lobby → Nhận vai
→ Bản đồ chợ → Thực hiện hành động theo vai
→ Giao dịch → Tổng kết vòng → Báo cáo cuối phiên
```

Ví dụ một interaction:

> Người tiêu dùng bấm “Trả giá” → nhập 8 nghìn Đồng → hệ thống kiểm tra số dư → gửi đề nghị cho người bán → hiển thị trạng thái “Đang chờ phản hồi” → cập nhật khi người bán chấp nhận, từ chối hoặc counter.

SRS hiện tại đã chứa nền tảng cho UID, nhưng UID sẽ đi sâu hơn vào từng màn hình, nút bấm, trạng thái và luồng tương tác. Nó là cầu nối trực tiếp giữa SRS và bước thiết kế UI/wireframe.

> Lên kế hoạch làm User Interaction Document (UID) cho tôi

<details><summary>10 previous messages</summary>

> Mình sẽ dựa trực tiếp trên SRS vừa hoàn thiện, trước hết kiểm kê toàn bộ màn hình, vai, trạng thái và interaction đã được khóa để UID không mâu thuẫn với luật game. Sau đó mình sẽ hỏi những lựa chọn UX thật sự còn mở, như mức độ wireframe và cách tổ chức tài liệu.
>
> <details><summary>Ran a command</summary>
>
> - Ran ``Write-Output '--- FILES ---'; rg --files; Write-Output "`n--- SRS UI/INTERACTION HEADINGS ---"; rg -n '^## |^### ' 'SRS MLN122.md'; Write-Output "`n--- SCREEN IDS ---"; rg -n '^\| `UI-' 'SRS MLN122.md'; Write-Output "`n--- INTERACTION/STATE KEYWORDS ---"; rg -n 'loading|empty|error|disconnect|reconnect|dialog|offer|counter|MARKET_OPEN|DECISION|RECAP' 'SRS MLN122.md' | Select-Object -First 120``
>
> </details>
>
> SRS đã khóa 14 màn hình, 4 dashboard vai, 5 khu bản đồ và đầy đủ trạng thái realtime. UID vì vậy có thể đi theo ba mức rất khác nhau; mình cần chốt mức đầu ra để tránh tài liệu hoặc quá trừu tượng, hoặc vô tình biến thành một bộ thiết kế high-fidelity.
>
> User input response
>
> - UID nên được bàn giao theo hình thức nào?
>   - Một file Markdown đầy đủ (Recommended)
> - UID nên khóa thiết kế tới mức nào?
>   - Chỉ user flow
> - Bạn muốn wireframe trong UID được biểu diễn như thế nào?
>   - ASCII + Mermaid (Recommended)
>
> Mình sẽ hiểu lựa chọn của bạn là **UID thiên về luồng**, không khóa màu, typography hay chi tiết design system. Wireframe chỉ dùng để minh họa các điểm chuyển quan trọng. Còn ba quyết định UX sẽ ảnh hưởng toàn bộ sơ đồ điều hướng: phạm vi flow, màn hình trung tâm và cách hướng dẫn người chơi mới.
>
> User input response
>
> - UID cần mô tả những luồng nào?
>   - Toàn bộ end-to-end (Recommended)
> - Màn hình trung tâm của người chơi nên là gì?
>   - Bản đồ làm hub (Recommended)
> - Trong giai đoạn INTRO, người chơi được hướng dẫn thế nào?
>   - Tutorial 3 bước theo vai (Recommended)
>
> Bây giờ chỉ còn ba hành vi cần khóa để UID thật sự “decision complete”: hệ thống có tự giật người chơi sang màn hình mới khi đổi phase hay không, tutorial có lặp lại không, và UID có viết toàn bộ microcopy hay chỉ khóa các câu quan trọng.
>
> User input response
>
> - Khi vòng chuyển giai đoạn, hệ thống nên điều hướng người chơi thế nào?
>   - Thông báo + CTA (Recommended)
> - Tutorial ba bước có bắt buộc ở các lần chơi sau không?
>   - Bắt buộc lần đầu mỗi vai (Recommended)
> - UID nên đặc tả nội dung chữ tới mức nào?
>   - Khóa copy quan trọng (Recommended)
>
> Plan
>
> # Kế hoạch xây dựng User Interaction Document cho “Phiên chợ giá trị Online”
>
> ## 1. Tóm tắt
>
> Tạo mới `UID MLN122.md`, lấy `SRS MLN122.md` làm nguồn sự thật.
>
> UID sẽ:
>
> - Mô tả toàn bộ user flow từ đăng nhập đến lịch sử phiên.
> - Bao phủ host, người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Lấy bản đồ chợ 2D làm màn hình trung tâm.
> - Dùng Mermaid cho flow/state và ASCII cho wireframe low-fi.
> - Khóa CTA, lỗi, trạng thái và nội dung lý thuyết quan trọng.
> - Không khóa màu sắc, typography, branding hoặc design system high-fidelity.
> - Truy vết mỗi flow về `UI`, `FR`, `BR`, `LT` và WebSocket event trong SRS.
>
> ## 2. Cấu trúc UID
>
> ### Quản lý tài liệu
>
> Bổ sung metadata, đối tượng sử dụng và quy ước ID:
>
> - `UF-*`: user flow.
> - `IX-*`: interaction.
> - `WF-*`: wireframe.
> - `NAV-*`: quy tắc điều hướng.
> - `COPY-*`: nội dung quan trọng.
> - `STATE-*`: trạng thái giao diện.
>
> ### Kiến trúc điều hướng
>
> Khóa mobile player shell gồm ba điểm truy cập:
>
> - **Chợ:** bản đồ 2D, màn hình mặc định.
> - **Nhiệm vụ:** dashboard theo vai.
> - **Quan sát:** cung–cầu, giá trị và giá thị trường.
>
> Click các khu trên bản đồ mở đúng màn hình chức năng. Mọi màn hình có hành động “Về bản đồ”.
>
> Khi phase thay đổi:
>
> - Không tự chuyển màn hình người chơi.
> - Khóa action không còn hợp lệ.
> - Hiển thị banner và CTA **“Đi tới nhiệm vụ”**.
> - Host/projector tự cập nhật sang event, settlement hoặc recap công khai.
>
> ### Danh mục màn hình
>
> UID mô tả flow và trạng thái cho đủ 14 màn hình SRS:
>
> 1. Đăng nhập/đăng ký.
> 2. Trang chủ.
> 3. Lobby.
> 4. Host/projector.
> 5. Bản đồ chợ.
> 6. Dashboard người sản xuất.
> 7. Khu mua hàng.
> 8. Trung tâm phân phối.
> 9. Dashboard Nhà nước.
> 10. Dialog giao dịch.
> 11. Tháp quan sát.
> 12. Tổng kết vòng.
> 13. Debrief cuối phiên.
> 14. Hồ sơ/lịch sử.
>
> Mỗi màn hình ghi:
>
> - Điểm vào và điểm thoát.
> - Người dùng được phép truy cập.
> - Phase hợp lệ.
> - Primary/secondary action.
> - Trạng thái loading, empty, locked, error, offline và bot takeover.
> - Back behavior.
> - CTA/microcopy quan trọng.
> - Tham chiếu SRS và cơ sở lý thuyết.
>
> ## 3. User flow cần đặc tả
>
> ### Luồng tài khoản
>
> - Google Sign-In.
> - Đăng ký email, xác minh và đăng nhập.
> - Quên/đặt lại mật khẩu.
> - Liên kết Google và email trùng verified email.
> - Chỉnh hồ sơ, xem lịch sử và xóa tài khoản.
>
> ### Luồng host
>
> ```text
> Đăng nhập → Tạo phòng → Chia sẻ QR
> → Chờ đủ người/ready → Kiểm tra phân vai
> → INTRO → Điều phối 4 vòng
> → Debrief → Hoàn tất/lưu lịch sử
> ```
>
> Bao gồm:
>
> - Start guard.
> - Pause/resume.
> - Gia hạn phase.
> - Chuyển vòng.
> - Xử lý player mất kết nối.
> - Host mất kết nối và phiên `INCOMPLETE`.
>
> ### Luồng người chơi chung
>
> ```text
> Tham gia phòng → Ready → Nhận vai
> → Tutorial theo vai → Bản đồ chợ
> → Event → Decision → Market → Settlement → Recap
> → Lặp 4 vòng → Debrief
> ```
>
> Tutorial có ba bước:
>
> 1. Mục tiêu của vai.
> 2. Ba hành động quan trọng.
> 3. Dữ liệu cần quan sát.
>
> Tutorial bắt buộc lần đầu với mỗi vai/scenario. Những lần sau được bỏ qua nhưng luôn có thể mở lại.
>
> ### Người sản xuất
>
> ```text
> Xem hồ sơ lao động
> → Chọn sản lượng → Xác nhận chi phí
> → Chọn bán trực tiếp hoặc bán sỉ
> → Niêm yết → Nhận offer
> → Accept/Reject/Counter
> → Theo dõi hàng bán/tồn
> → Xem lợi nhuận và tác động quy luật giá trị
> ```
>
> Bao gồm nhánh:
>
> - Không đủ vốn.
> - Vượt công suất.
> - Hủy/sửa sản lượng.
> - Đầu tư công nghệ.
> - Nhận hỗ trợ công nghệ.
> - Hàng được kho lạnh bảo vệ hoặc bị hỏng.
>
> ### Người tiêu dùng
>
> ```text
> Xem need và ngân sách
> → Mở khu mua hàng → So sánh listing
> → Mua ngay hoặc trả giá
> → Chờ phản hồi → Accept/Reject/Counter
> → Nhận hàng → Cập nhật need/utility
> ```
>
> Bao gồm sold-out, thiếu tiền, offer hết hạn, stale state và mua vượt nhu cầu.
>
> ### Trung gian
>
> ```text
> Mở wholesale inbox
> → Xem đề nghị bán sỉ
> → Accept/Reject/Counter
> → Thanh toán và nhận hàng
> → Tạo retail listing
> → Bán cho người tiêu dùng
> → Xem lợi nhuận/kết nối/hàng tồn
> ```
>
> ### Nhà nước
>
> ```text
> Xem dữ liệu tổng hợp
> → So sánh policy card
> → Chọn policy và đối tượng
> → Xem chi phí dự kiến
> → Xác nhận → Theo dõi hiệu lực
> → Xem social score
> ```
>
> Bao gồm bốn chính sách, không can thiệp, thiếu ngân sách và quá cửa sổ hành động.
>
> ### Giao dịch
>
> Có hai Mermaid sequence flow riêng:
>
> - Direct retail: listing → buy/offer → counter → completed/rejected.
> - Wholesale: producer offer → intermediary response → ownership transfer → retail listing.
>
> Mỗi bước ánh xạ tới WebSocket command/event tương ứng.
>
> ### Realtime và phục hồi
>
> ```text
> Mạng chập chờn → Banner reconnecting
> → Offline <15 giây: giữ quyền
> → Offline ≥15 giây: bot takeover
> → Reconnect → Nhận snapshot
> → Reclaim role tại action boundary
> ```
>
> Bao gồm duplicate tab, stale state, action retry và room phase đã thay đổi khi dialog còn mở.
>
> ## 4. Wireframe và interaction specification
>
> ### Wireframe ASCII
>
> Tạo wireframe low-fi cho các điểm chuyển quan trọng:
>
> - `WF-01`: Auth và Home.
> - `WF-02`: Lobby mobile.
> - `WF-03`: Host/projector lobby.
> - `WF-04`: Tutorial ba bước.
> - `WF-05`: Mobile map shell.
> - `WF-06`: Producer dashboard.
> - `WF-07`: Marketplace/Consumer.
> - `WF-08`: Intermediary dashboard.
> - `WF-09`: Government policy console.
> - `WF-10`: Buy/offer/counter dialog.
> - `WF-11`: Observatory.
> - `WF-12`: Round recap.
> - `WF-13`: Final debrief/history.
> - `WF-14`: Host live control.
>
> Wireframe chỉ khóa hierarchy, vị trí tương đối, CTA và điểm điều hướng; không quy định pixel, màu hoặc typography.
>
> ### Mermaid
>
> Tạo tối thiểu các sơ đồ:
>
> - Sitemap tổng thể.
> - Session lifecycle.
> - Host journey.
> - Player phase loop.
> - Bốn role journey.
> - Retail transaction.
> - Wholesale transaction.
> - Government policy.
> - Reconnect/bot takeover.
>
> ### Ma trận chuyển màn hình
>
> Mỗi transition ghi:
>
> | From | Trigger | Guard | Destination | Back behavior | Error fallback |
> | ---- | ------- | ----- | ----------- | ------------- | -------------- |
>
> ### Ma trận interaction–realtime
>
> Mỗi hành động quan trọng ghi:
>
> | Interaction | UI phản hồi tức thời | Command/API | Success event | Failure state |
> | ----------- | -------------------- | ----------- | ------------- | ------------- |
>
> Ví dụ:
>
> ```text
> IX-CONSUMER-BUY
> Bấm “Mua ngay”
> → Khóa nút + loading
> → consumer:buy
> → market:trade_completed
> → Success summary hoặc lỗi sold-out/stale/balance
> ```
>
> ## 5. Microcopy và trạng thái
>
> Khóa nội dung cho:
>
> - CTA chính.
> - Tutorial.
> - Event banner.
> - Phase prompt.
> - Xác nhận giao dịch/chính sách.
> - Lỗi nghiệp vụ.
> - Reconnect và bot takeover.
> - No-price/no-transaction.
> - Giải thích giá trị–giá cả, cung–cầu và ba tác động.
>
> Các CTA chính gồm:
>
> - “Tạo phòng”
> - “Tham gia phiên chợ”
> - “Tôi đã sẵn sàng”
> - “Đi tới nhiệm vụ”
> - “Sản xuất”
> - “Đưa ra chợ”
> - “Bán sỉ”
> - “Mua ngay”
> - “Trả giá”
> - “Chấp nhận”
> - “Trả giá lại”
> - “Áp dụng chính sách”
> - “Xem tổng kết”
> - “Về bản đồ”
>
> UID không viết toàn bộ nhãn phụ; những nội dung còn lại được mô tả theo ý nghĩa.
>
> ## 6. Interface bổ sung
>
> UID không thay đổi luật gameplay hoặc API đã khóa trong SRS. Riêng lựa chọn tutorial lần đầu mỗi vai cần ghi nhận một SRS delta:
>
> ```text
> TutorialProgress {
>   userId
>   scenarioVersion
>   role
>   completedAt
> }
> ```
>
> Bổ sung interaction/interface dự kiến:
>
> - `participant:tutorial_completed`
> - `participant:tutorial_progress`
> - Lưu tiến độ theo account, scenario version và role.
> - Host chỉ thấy trạng thái hoàn thành/chưa hoàn thành, không thấy nội dung thao tác cá nhân.
> - Người đã hoàn thành được nút “Bỏ qua”; người chưa hoàn thành phải xem đủ ba bước.
>
> UID phải đánh dấu đây là dependency cần cập nhật lại SRS trước khi triển khai backend.
>
> ## 7. Accessibility và responsive behavior
>
> - Mobile player thiết kế từ chiều rộng 360px.
> - Host/projector thiết kế cho 1280×720 trở lên.
> - Dialog mobile dùng full-screen hoặc bottom sheet; desktop dùng modal.
> - Focus không bị mất khi realtime update.
> - Dialog giữ focus và trả focus về trigger khi đóng.
> - Toast quan trọng có vùng live announcement.
> - Timer không chỉ dựa vào màu.
> - Chart có phần tóm tắt bằng chữ.
> - Action bị khóa phải giải thích lý do.
> - Touch target chính tối thiểu 44×44 CSS px.
> - Phase change không giật focus hoặc tự chuyển route người chơi.
>
> ## 8. Kiểm thử và tiêu chí hoàn thành UID
>
> ### Kiểm thử flow
>
> - Google/email auth và lỗi xác thực.
> - Tạo/join/full/expired room.
> - Tutorial lần đầu và lần chơi lại.
> - Toàn bộ flow của bốn vai.
> - Buy-now, offer, counter và wholesale.
> - Bốn policy Nhà nước.
> - Phase change giữ route nhưng khóa action cũ và hiện CTA.
> - Không có giao dịch thì không hiển thị giá giả.
> - Disconnect dưới/trên 15 giây và reclaim.
> - Session completed và incomplete.
> - Profile/history/delete account.
>
> ### Kiểm tra tài liệu
>
> - Mỗi flow có entry, precondition, happy path, alternative path, exit và SRS reference.
> - Mỗi screen có loading, empty, locked, error và offline state phù hợp.
> - Mỗi interaction quan trọng có command/event hoặc API liên quan.
> - Mọi `UI-*`, `FR-*`, `LT-*` được tham chiếu phải tồn tại trong SRS.
> - Mọi ID UID là duy nhất.
> - Mermaid render được và code fence cân bằng.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Tiền tệ luôn là VND, hiển thị theo nghìn Đồng.
>
> ## 9. Giả định đã khóa
>
> - Đầu ra là một file `UID MLN122.md`.
> - UID bao phủ toàn bộ end-to-end flow.
> - Tài liệu viết bằng tiếng Việt.
> - Bản đồ chợ là hub chính.
> - Người chơi không bị tự động chuyển màn hình khi phase đổi.
> - Tutorial bắt buộc lần đầu với mỗi vai.
> - Chỉ khóa microcopy quan trọng.
> - Wireframe dùng ASCII; flow/state dùng Mermaid.
> - Không tạo HTML prototype hoặc thiết kế high-fidelity.
> - `SRS MLN122.md` tiếp tục là nguồn sự thật cho luật và dữ liệu.
>
> Plan implementation
>
> Status: completed
>
> # Kế hoạch xây dựng User Interaction Document cho “Phiên chợ giá trị Online”
>
> ## 1. Tóm tắt
>
> Tạo mới `UID MLN122.md`, lấy `SRS MLN122.md` làm nguồn sự thật.
>
> UID sẽ:
>
> - Mô tả toàn bộ user flow từ đăng nhập đến lịch sử phiên.
> - Bao phủ host, người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Lấy bản đồ chợ 2D làm màn hình trung tâm.
> - Dùng Mermaid cho flow/state và ASCII cho wireframe low-fi.
> - Khóa CTA, lỗi, trạng thái và nội dung lý thuyết quan trọng.
> - Không khóa màu sắc, typography, branding hoặc design system high-fidelity.
> - Truy vết mỗi flow về `UI`, `FR`, `BR`, `LT` và WebSocket event trong SRS.
>
> ## 2. Cấu trúc UID
>
> ### Quản lý tài liệu
>
> Bổ sung metadata, đối tượng sử dụng và quy ước ID:
>
> - `UF-*`: user flow.
> - `IX-*`: interaction.
> - `WF-*`: wireframe.
> - `NAV-*`: quy tắc điều hướng.
> - `COPY-*`: nội dung quan trọng.
> - `STATE-*`: trạng thái giao diện.
>
> ### Kiến trúc điều hướng
>
> Khóa mobile player shell gồm ba điểm truy cập:
>
> - **Chợ:** bản đồ 2D, màn hình mặc định.
> - **Nhiệm vụ:** dashboard theo vai.
> - **Quan sát:** cung–cầu, giá trị và giá thị trường.
>
> Click các khu trên bản đồ mở đúng màn hình chức năng. Mọi màn hình có hành động “Về bản đồ”.
>
> Khi phase thay đổi:
>
> - Không tự chuyển màn hình người chơi.
> - Khóa action không còn hợp lệ.
> - Hiển thị banner và CTA **“Đi tới nhiệm vụ”**.
> - Host/projector tự cập nhật sang event, settlement hoặc recap công khai.
>
> ### Danh mục màn hình
>
> UID mô tả flow và trạng thái cho đủ 14 màn hình SRS:
>
> 1. Đăng nhập/đăng ký.
> 2. Trang chủ.
> 3. Lobby.
> 4. Host/projector.
> 5. Bản đồ chợ.
> 6. Dashboard người sản xuất.
> 7. Khu mua hàng.
> 8. Trung tâm phân phối.
> 9. Dashboard Nhà nước.
> 10. Dialog giao dịch.
> 11. Tháp quan sát.
> 12. Tổng kết vòng.
> 13. Debrief cuối phiên.
> 14. Hồ sơ/lịch sử.
>
> Mỗi màn hình ghi:
>
> - Điểm vào và điểm thoát.
> - Người dùng được phép truy cập.
> - Phase hợp lệ.
> - Primary/secondary action.
> - Trạng thái loading, empty, locked, error, offline và bot takeover.
> - Back behavior.
> - CTA/microcopy quan trọng.
> - Tham chiếu SRS và cơ sở lý thuyết.
>
> ## 3. User flow cần đặc tả
>
> ### Luồng tài khoản
>
> - Google Sign-In.
> - Đăng ký email, xác minh và đăng nhập.
> - Quên/đặt lại mật khẩu.
> - Liên kết Google và email trùng verified email.
> - Chỉnh hồ sơ, xem lịch sử và xóa tài khoản.
>
> ### Luồng host
>
> ```text
> Đăng nhập → Tạo phòng → Chia sẻ QR
> → Chờ đủ người/ready → Kiểm tra phân vai
> → INTRO → Điều phối 4 vòng
> → Debrief → Hoàn tất/lưu lịch sử
> ```
>
> Bao gồm:
>
> - Start guard.
> - Pause/resume.
> - Gia hạn phase.
> - Chuyển vòng.
> - Xử lý player mất kết nối.
> - Host mất kết nối và phiên `INCOMPLETE`.
>
> ### Luồng người chơi chung
>
> ```text
> Tham gia phòng → Ready → Nhận vai
> → Tutorial theo vai → Bản đồ chợ
> → Event → Decision → Market → Settlement → Recap
> → Lặp 4 vòng → Debrief
> ```
>
> Tutorial có ba bước:
>
> 1. Mục tiêu của vai.
> 2. Ba hành động quan trọng.
> 3. Dữ liệu cần quan sát.
>
> Tutorial bắt buộc lần đầu với mỗi vai/scenario. Những lần sau được bỏ qua nhưng luôn có thể mở lại.
>
> ### Người sản xuất
>
> ```text
> Xem hồ sơ lao động
> → Chọn sản lượng → Xác nhận chi phí
> → Chọn bán trực tiếp hoặc bán sỉ
> → Niêm yết → Nhận offer
> → Accept/Reject/Counter
> → Theo dõi hàng bán/tồn
> → Xem lợi nhuận và tác động quy luật giá trị
> ```
>
> Bao gồm nhánh:
>
> - Không đủ vốn.
> - Vượt công suất.
> - Hủy/sửa sản lượng.
> - Đầu tư công nghệ.
> - Nhận hỗ trợ công nghệ.
> - Hàng được kho lạnh bảo vệ hoặc bị hỏng.
>
> ### Người tiêu dùng
>
> ```text
> Xem need và ngân sách
> → Mở khu mua hàng → So sánh listing
> → Mua ngay hoặc trả giá
> → Chờ phản hồi → Accept/Reject/Counter
> → Nhận hàng → Cập nhật need/utility
> ```
>
> Bao gồm sold-out, thiếu tiền, offer hết hạn, stale state và mua vượt nhu cầu.
>
> ### Trung gian
>
> ```text
> Mở wholesale inbox
> → Xem đề nghị bán sỉ
> → Accept/Reject/Counter
> → Thanh toán và nhận hàng
> → Tạo retail listing
> → Bán cho người tiêu dùng
> → Xem lợi nhuận/kết nối/hàng tồn
> ```
>
> ### Nhà nước
>
> ```text
> Xem dữ liệu tổng hợp
> → So sánh policy card
> → Chọn policy và đối tượng
> → Xem chi phí dự kiến
> → Xác nhận → Theo dõi hiệu lực
> → Xem social score
> ```
>
> Bao gồm bốn chính sách, không can thiệp, thiếu ngân sách và quá cửa sổ hành động.
>
> ### Giao dịch
>
> Có hai Mermaid sequence flow riêng:
>
> - Direct retail: listing → buy/offer → counter → completed/rejected.
> - Wholesale: producer offer → intermediary response → ownership transfer → retail listing.
>
> Mỗi bước ánh xạ tới WebSocket command/event tương ứng.
>
> ### Realtime và phục hồi
>
> ```text
> Mạng chập chờn → Banner reconnecting
> → Offline <15 giây: giữ quyền
> → Offline ≥15 giây: bot takeover
> → Reconnect → Nhận snapshot
> → Reclaim role tại action boundary
> ```
>
> Bao gồm duplicate tab, stale state, action retry và room phase đã thay đổi khi dialog còn mở.
>
> ## 4. Wireframe và interaction specification
>
> ### Wireframe ASCII
>
> Tạo wireframe low-fi cho các điểm chuyển quan trọng:
>
> - `WF-01`: Auth và Home.
> - `WF-02`: Lobby mobile.
> - `WF-03`: Host/projector lobby.
> - `WF-04`: Tutorial ba bước.
> - `WF-05`: Mobile map shell.
> - `WF-06`: Producer dashboard.
> - `WF-07`: Marketplace/Consumer.
> - `WF-08`: Intermediary dashboard.
> - `WF-09`: Government policy console.
> - `WF-10`: Buy/offer/counter dialog.
> - `WF-11`: Observatory.
> - `WF-12`: Round recap.
> - `WF-13`: Final debrief/history.
> - `WF-14`: Host live control.
>
> Wireframe chỉ khóa hierarchy, vị trí tương đối, CTA và điểm điều hướng; không quy định pixel, màu hoặc typography.
>
> ### Mermaid
>
> Tạo tối thiểu các sơ đồ:
>
> - Sitemap tổng thể.
> - Session lifecycle.
> - Host journey.
> - Player phase loop.
> - Bốn role journey.
> - Retail transaction.
> - Wholesale transaction.
> - Government policy.
> - Reconnect/bot takeover.
>
> ### Ma trận chuyển màn hình
>
> Mỗi transition ghi:
>
> | From | Trigger | Guard | Destination | Back behavior | Error fallback |
> | ---- | ------- | ----- | ----------- | ------------- | -------------- |
>
> ### Ma trận interaction–realtime
>
> Mỗi hành động quan trọng ghi:
>
> | Interaction | UI phản hồi tức thời | Command/API | Success event | Failure state |
> | ----------- | -------------------- | ----------- | ------------- | ------------- |
>
> Ví dụ:
>
> ```text
> IX-CONSUMER-BUY
> Bấm “Mua ngay”
> → Khóa nút + loading
> → consumer:buy
> → market:trade_completed
> → Success summary hoặc lỗi sold-out/stale/balance
> ```
>
> ## 5. Microcopy và trạng thái
>
> Khóa nội dung cho:
>
> - CTA chính.
> - Tutorial.
> - Event banner.
> - Phase prompt.
> - Xác nhận giao dịch/chính sách.
> - Lỗi nghiệp vụ.
> - Reconnect và bot takeover.
> - No-price/no-transaction.
> - Giải thích giá trị–giá cả, cung–cầu và ba tác động.
>
> Các CTA chính gồm:
>
> - “Tạo phòng”
> - “Tham gia phiên chợ”
> - “Tôi đã sẵn sàng”
> - “Đi tới nhiệm vụ”
> - “Sản xuất”
> - “Đưa ra chợ”
> - “Bán sỉ”
> - “Mua ngay”
> - “Trả giá”
> - “Chấp nhận”
> - “Trả giá lại”
> - “Áp dụng chính sách”
> - “Xem tổng kết”
> - “Về bản đồ”
>
> UID không viết toàn bộ nhãn phụ; những nội dung còn lại được mô tả theo ý nghĩa.
>
> ## 6. Interface bổ sung
>
> UID không thay đổi luật gameplay hoặc API đã khóa trong SRS. Riêng lựa chọn tutorial lần đầu mỗi vai cần ghi nhận một SRS delta:
>
> ```text
> TutorialProgress {
>   userId
>   scenarioVersion
>   role
>   completedAt
> }
> ```
>
> Bổ sung interaction/interface dự kiến:
>
> - `participant:tutorial_completed`
> - `participant:tutorial_progress`
> - Lưu tiến độ theo account, scenario version và role.
> - Host chỉ thấy trạng thái hoàn thành/chưa hoàn thành, không thấy nội dung thao tác cá nhân.
> - Người đã hoàn thành được nút “Bỏ qua”; người chưa hoàn thành phải xem đủ ba bước.
>
> UID phải đánh dấu đây là dependency cần cập nhật lại SRS trước khi triển khai backend.
>
> ## 7. Accessibility và responsive behavior
>
> - Mobile player thiết kế từ chiều rộng 360px.
> - Host/projector thiết kế cho 1280×720 trở lên.
> - Dialog mobile dùng full-screen hoặc bottom sheet; desktop dùng modal.
> - Focus không bị mất khi realtime update.
> - Dialog giữ focus và trả focus về trigger khi đóng.
> - Toast quan trọng có vùng live announcement.
> - Timer không chỉ dựa vào màu.
> - Chart có phần tóm tắt bằng chữ.
> - Action bị khóa phải giải thích lý do.
> - Touch target chính tối thiểu 44×44 CSS px.
> - Phase change không giật focus hoặc tự chuyển route người chơi.
>
> ## 8. Kiểm thử và tiêu chí hoàn thành UID
>
> ### Kiểm thử flow
>
> - Google/email auth và lỗi xác thực.
> - Tạo/join/full/expired room.
> - Tutorial lần đầu và lần chơi lại.
> - Toàn bộ flow của bốn vai.
> - Buy-now, offer, counter và wholesale.
> - Bốn policy Nhà nước.
> - Phase change giữ route nhưng khóa action cũ và hiện CTA.
> - Không có giao dịch thì không hiển thị giá giả.
> - Disconnect dưới/trên 15 giây và reclaim.
> - Session completed và incomplete.
> - Profile/history/delete account.
>
> ### Kiểm tra tài liệu
>
> - Mỗi flow có entry, precondition, happy path, alternative path, exit và SRS reference.
> - Mỗi screen có loading, empty, locked, error và offline state phù hợp.
> - Mỗi interaction quan trọng có command/event hoặc API liên quan.
> - Mọi `UI-*`, `FR-*`, `LT-*` được tham chiếu phải tồn tại trong SRS.
> - Mọi ID UID là duy nhất.
> - Mermaid render được và code fence cân bằng.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Tiền tệ luôn là VND, hiển thị theo nghìn Đồng.
>
> ## 9. Giả định đã khóa
>
> - Đầu ra là một file `UID MLN122.md`.
> - UID bao phủ toàn bộ end-to-end flow.
> - Tài liệu viết bằng tiếng Việt.
> - Bản đồ chợ là hub chính.
> - Người chơi không bị tự động chuyển màn hình khi phase đổi.
> - Tutorial bắt buộc lần đầu với mỗi vai.
> - Chỉ khóa microcopy quan trọng.
> - Wireframe dùng ASCII; flow/state dùng Mermaid.
> - Không tạo HTML prototype hoặc thiết kế high-fidelity.
> - `SRS MLN122.md` tiếp tục là nguồn sự thật cho luật và dữ liệu.

</details>

> PLEASE IMPLEMENT THIS PLAN:
>
> # Kế hoạch xây dựng User Interaction Document cho “Phiên chợ giá trị Online”
>
> ## 1. Tóm tắt
>
> Tạo mới `UID MLN122.md`, lấy `SRS MLN122.md` làm nguồn sự thật.
>
> UID sẽ:
>
> - Mô tả toàn bộ user flow từ đăng nhập đến lịch sử phiên.
> - Bao phủ host, người sản xuất, người tiêu dùng, trung gian và Nhà nước.
> - Lấy bản đồ chợ 2D làm màn hình trung tâm.
> - Dùng Mermaid cho flow/state và ASCII cho wireframe low-fi.
> - Khóa CTA, lỗi, trạng thái và nội dung lý thuyết quan trọng.
> - Không khóa màu sắc, typography, branding hoặc design system high-fidelity.
> - Truy vết mỗi flow về `UI`, `FR`, `BR`, `LT` và WebSocket event trong SRS.
>
> ## 2. Cấu trúc UID
>
> ### Quản lý tài liệu
>
> Bổ sung metadata, đối tượng sử dụng và quy ước ID:
>
> - `UF-*`: user flow.
> - `IX-*`: interaction.
> - `WF-*`: wireframe.
> - `NAV-*`: quy tắc điều hướng.
> - `COPY-*`: nội dung quan trọng.
> - `STATE-*`: trạng thái giao diện.
>
> ### Kiến trúc điều hướng
>
> Khóa mobile player shell gồm ba điểm truy cập:
>
> - **Chợ:** bản đồ 2D, màn hình mặc định.
> - **Nhiệm vụ:** dashboard theo vai.
> - **Quan sát:** cung–cầu, giá trị và giá thị trường.
>
> Click các khu trên bản đồ mở đúng màn hình chức năng. Mọi màn hình có hành động “Về bản đồ”.
>
> Khi phase thay đổi:
>
> - Không tự chuyển màn hình người chơi.
> - Khóa action không còn hợp lệ.
> - Hiển thị banner và CTA **“Đi tới nhiệm vụ”**.
> - Host/projector tự cập nhật sang event, settlement hoặc recap công khai.
>
> ### Danh mục màn hình
>
> UID mô tả flow và trạng thái cho đủ 14 màn hình SRS:
>
> 1. Đăng nhập/đăng ký.
> 2. Trang chủ.
> 3. Lobby.
> 4. Host/projector.
> 5. Bản đồ chợ.
> 6. Dashboard người sản xuất.
> 7. Khu mua hàng.
> 8. Trung tâm phân phối.
> 9. Dashboard Nhà nước.
> 10. Dialog giao dịch.
> 11. Tháp quan sát.
> 12. Tổng kết vòng.
> 13. Debrief cuối phiên.
> 14. Hồ sơ/lịch sử.
>
> Mỗi màn hình ghi:
>
> - Điểm vào và điểm thoát.
> - Người dùng được phép truy cập.
> - Phase hợp lệ.
> - Primary/secondary action.
> - Trạng thái loading, empty, locked, error, offline và bot takeover.
> - Back behavior.
> - CTA/microcopy quan trọng.
> - Tham chiếu SRS và cơ sở lý thuyết.
>
> ## 3. User flow cần đặc tả
>
> ### Luồng tài khoản
>
> - Google Sign-In.
> - Đăng ký email, xác minh và đăng nhập.
> - Quên/đặt lại mật khẩu.
> - Liên kết Google và email trùng verified email.
> - Chỉnh hồ sơ, xem lịch sử và xóa tài khoản.
>
> ### Luồng host
>
> ```text
> Đăng nhập → Tạo phòng → Chia sẻ QR
> → Chờ đủ người/ready → Kiểm tra phân vai
> → INTRO → Điều phối 4 vòng
> → Debrief → Hoàn tất/lưu lịch sử
> ```
>
> Bao gồm:
>
> - Start guard.
> - Pause/resume.
> - Gia hạn phase.
> - Chuyển vòng.
> - Xử lý player mất kết nối.
> - Host mất kết nối và phiên `INCOMPLETE`.
>
> ### Luồng người chơi chung
>
> ```text
> Tham gia phòng → Ready → Nhận vai
> → Tutorial theo vai → Bản đồ chợ
> → Event → Decision → Market → Settlement → Recap
> → Lặp 4 vòng → Debrief
> ```
>
> Tutorial có ba bước:
>
> 1. Mục tiêu của vai.
> 2. Ba hành động quan trọng.
> 3. Dữ liệu cần quan sát.
>
> Tutorial bắt buộc lần đầu với mỗi vai/scenario. Những lần sau được bỏ qua nhưng luôn có thể mở lại.
>
> ### Người sản xuất
>
> ```text
> Xem hồ sơ lao động
> → Chọn sản lượng → Xác nhận chi phí
> → Chọn bán trực tiếp hoặc bán sỉ
> → Niêm yết → Nhận offer
> → Accept/Reject/Counter
> → Theo dõi hàng bán/tồn
> → Xem lợi nhuận và tác động quy luật giá trị
> ```
>
> Bao gồm nhánh:
>
> - Không đủ vốn.
> - Vượt công suất.
> - Hủy/sửa sản lượng.
> - Đầu tư công nghệ.
> - Nhận hỗ trợ công nghệ.
> - Hàng được kho lạnh bảo vệ hoặc bị hỏng.
>
> ### Người tiêu dùng
>
> ```text
> Xem need và ngân sách
> → Mở khu mua hàng → So sánh listing
> → Mua ngay hoặc trả giá
> → Chờ phản hồi → Accept/Reject/Counter
> → Nhận hàng → Cập nhật need/utility
> ```
>
> Bao gồm sold-out, thiếu tiền, offer hết hạn, stale state và mua vượt nhu cầu.
>
> ### Trung gian
>
> ```text
> Mở wholesale inbox
> → Xem đề nghị bán sỉ
> → Accept/Reject/Counter
> → Thanh toán và nhận hàng
> → Tạo retail listing
> → Bán cho người tiêu dùng
> → Xem lợi nhuận/kết nối/hàng tồn
> ```
>
> ### Nhà nước
>
> ```text
> Xem dữ liệu tổng hợp
> → So sánh policy card
> → Chọn policy và đối tượng
> → Xem chi phí dự kiến
> → Xác nhận → Theo dõi hiệu lực
> → Xem social score
> ```
>
> Bao gồm bốn chính sách, không can thiệp, thiếu ngân sách và quá cửa sổ hành động.
>
> ### Giao dịch
>
> Có hai Mermaid sequence flow riêng:
>
> - Direct retail: listing → buy/offer → counter → completed/rejected.
> - Wholesale: producer offer → intermediary response → ownership transfer → retail listing.
>
> Mỗi bước ánh xạ tới WebSocket command/event tương ứng.
>
> ### Realtime và phục hồi
>
> ```text
> Mạng chập chờn → Banner reconnecting
> → Offline <15 giây: giữ quyền
> → Offline ≥15 giây: bot takeover
> → Reconnect → Nhận snapshot
> → Reclaim role tại action boundary
> ```
>
> Bao gồm duplicate tab, stale state, action retry và room phase đã thay đổi khi dialog còn mở.
>
> ## 4. Wireframe và interaction specification
>
> ### Wireframe ASCII
>
> Tạo wireframe low-fi cho các điểm chuyển quan trọng:
>
> - `WF-01`: Auth và Home.
> - `WF-02`: Lobby mobile.
> - `WF-03`: Host/projector lobby.
> - `WF-04`: Tutorial ba bước.
> - `WF-05`: Mobile map shell.
> - `WF-06`: Producer dashboard.
> - `WF-07`: Marketplace/Consumer.
> - `WF-08`: Intermediary dashboard.
> - `WF-09`: Government policy console.
> - `WF-10`: Buy/offer/counter dialog.
> - `WF-11`: Observatory.
> - `WF-12`: Round recap.
> - `WF-13`: Final debrief/history.
> - `WF-14`: Host live control.
>
> Wireframe chỉ khóa hierarchy, vị trí tương đối, CTA và điểm điều hướng; không quy định pixel, màu hoặc typography.
>
> ### Mermaid
>
> Tạo tối thiểu các sơ đồ:
>
> - Sitemap tổng thể.
> - Session lifecycle.
> - Host journey.
> - Player phase loop.
> - Bốn role journey.
> - Retail transaction.
> - Wholesale transaction.
> - Government policy.
> - Reconnect/bot takeover.
>
> ### Ma trận chuyển màn hình
>
> Mỗi transition ghi:
>
> | From | Trigger | Guard | Destination | Back behavior | Error fallback |
> | ---- | ------- | ----- | ----------- | ------------- | -------------- |
>
> ### Ma trận interaction–realtime
>
> Mỗi hành động quan trọng ghi:
>
> | Interaction | UI phản hồi tức thời | Command/API | Success event | Failure state |
> | ----------- | -------------------- | ----------- | ------------- | ------------- |
>
> Ví dụ:
>
> ```text
> IX-CONSUMER-BUY
> Bấm “Mua ngay”
> → Khóa nút + loading
> → consumer:buy
> → market:trade_completed
> → Success summary hoặc lỗi sold-out/stale/balance
> ```
>
> ## 5. Microcopy và trạng thái
>
> Khóa nội dung cho:
>
> - CTA chính.
> - Tutorial.
> - Event banner.
> - Phase prompt.
> - Xác nhận giao dịch/chính sách.
> - Lỗi nghiệp vụ.
> - Reconnect và bot takeover.
> - No-price/no-transaction.
> - Giải thích giá trị–giá cả, cung–cầu và ba tác động.
>
> Các CTA chính gồm:
>
> - “Tạo phòng”
> - “Tham gia phiên chợ”
> - “Tôi đã sẵn sàng”
> - “Đi tới nhiệm vụ”
> - “Sản xuất”
> - “Đưa ra chợ”
> - “Bán sỉ”
> - “Mua ngay”
> - “Trả giá”
> - “Chấp nhận”
> - “Trả giá lại”
> - “Áp dụng chính sách”
> - “Xem tổng kết”
> - “Về bản đồ”
>
> UID không viết toàn bộ nhãn phụ; những nội dung còn lại được mô tả theo ý nghĩa.
>
> ## 6. Interface bổ sung
>
> UID không thay đổi luật gameplay hoặc API đã khóa trong SRS. Riêng lựa chọn tutorial lần đầu mỗi vai cần ghi nhận một SRS delta:
>
> ```text
> TutorialProgress {
>   userId
>   scenarioVersion
>   role
>   completedAt
> }
> ```
>
> Bổ sung interaction/interface dự kiến:
>
> - `participant:tutorial_completed`
> - `participant:tutorial_progress`
> - Lưu tiến độ theo account, scenario version và role.
> - Host chỉ thấy trạng thái hoàn thành/chưa hoàn thành, không thấy nội dung thao tác cá nhân.
> - Người đã hoàn thành được nút “Bỏ qua”; người chưa hoàn thành phải xem đủ ba bước.
>
> UID phải đánh dấu đây là dependency cần cập nhật lại SRS trước khi triển khai backend.
>
> ## 7. Accessibility và responsive behavior
>
> - Mobile player thiết kế từ chiều rộng 360px.
> - Host/projector thiết kế cho 1280×720 trở lên.
> - Dialog mobile dùng full-screen hoặc bottom sheet; desktop dùng modal.
> - Focus không bị mất khi realtime update.
> - Dialog giữ focus và trả focus về trigger khi đóng.
> - Toast quan trọng có vùng live announcement.
> - Timer không chỉ dựa vào màu.
> - Chart có phần tóm tắt bằng chữ.
> - Action bị khóa phải giải thích lý do.
> - Touch target chính tối thiểu 44×44 CSS px.
> - Phase change không giật focus hoặc tự chuyển route người chơi.
>
> ## 8. Kiểm thử và tiêu chí hoàn thành UID
>
> ### Kiểm thử flow
>
> - Google/email auth và lỗi xác thực.
> - Tạo/join/full/expired room.
> - Tutorial lần đầu và lần chơi lại.
> - Toàn bộ flow của bốn vai.
> - Buy-now, offer, counter và wholesale.
> - Bốn policy Nhà nước.
> - Phase change giữ route nhưng khóa action cũ và hiện CTA.
> - Không có giao dịch thì không hiển thị giá giả.
> - Disconnect dưới/trên 15 giây và reclaim.
> - Session completed và incomplete.
> - Profile/history/delete account.
>
> ### Kiểm tra tài liệu
>
> - Mỗi flow có entry, precondition, happy path, alternative path, exit và SRS reference.
> - Mỗi screen có loading, empty, locked, error và offline state phù hợp.
> - Mỗi interaction quan trọng có command/event hoặc API liên quan.
> - Mọi `UI-*`, `FR-*`, `LT-*` được tham chiếu phải tồn tại trong SRS.
> - Mọi ID UID là duy nhất.
> - Mermaid render được và code fence cân bằng.
> - Không dùng lẫn giá trị, giá cả, chi phí cá biệt và TGLĐXHCT.
> - Tiền tệ luôn là VND, hiển thị theo nghìn Đồng.
>
> ## 9. Giả định đã khóa
>
> - Đầu ra là một file `UID MLN122.md`.
> - UID bao phủ toàn bộ end-to-end flow.
> - Tài liệu viết bằng tiếng Việt.
> - Bản đồ chợ là hub chính.
> - Người chơi không bị tự động chuyển màn hình khi phase đổi.
> - Tutorial bắt buộc lần đầu với mỗi vai.
> - Chỉ khóa microcopy quan trọng.
> - Wireframe dùng ASCII; flow/state dùng Mermaid.
> - Không tạo HTML prototype hoặc thiết kế high-fidelity.
> - `SRS MLN122.md` tiếp tục là nguồn sự thật cho luật và dữ liệu.

<details><summary>7 previous messages</summary>

> Mình sẽ tạo `UID MLN122.md` như một tài liệu flow-centric hoàn chỉnh, giữ nguyên SRS làm nguồn sự thật. Mình sẽ đặc tả luồng end-to-end, 14 wireframe ASCII, các sơ đồ Mermaid, ma trận transition/realtime, microcopy và trạng thái lỗi; sau đó kiểm tra tự động mọi tham chiếu `UI/FR/BR/LT` với SRS.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran ``$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pathlib import Path
import re
s=Path('SRS MLN122.md').read_text(encoding='utf-8')
for prefix in ['UI-','FR-','BR-','LT-']:
 ids=[]
 for line in s.splitlines():
  m=re.match(r'^\| `('+re.escape(prefix)+r'[^`]+)` \|',line)
  if m: ids.append(m.group(1))
 print(prefix,len(ids))
 print(' '.join(ids))
'@ | & $py -``
> - Ran `Test-Path 'UID MLN122.md'; Get-Item 'SRS MLN122.md' | Select-Object Length,LastWriteTime`
>
> </details>
>
> Mình đã khóa kiến trúc UID theo đúng lựa chọn của bạn: flow end-to-end, bản đồ làm hub, người chơi không bị tự chuyển route khi phase đổi, tutorial bắt buộc lần đầu mỗi vai. Giờ mình đang viết tài liệu và ánh xạ từng interaction với command/event trong SRS.
>
> <details><summary>Created a file, ran a command</summary>
>
> - Wrote `./UID MLN122.md` (+1369 -0)
> - Ran `Get-Item 'UID MLN122.md' | Select-Object Length,LastWriteTime; (Get-Content 'UID MLN122.md').Count; rg -n '^#{1,6} ' 'UID MLN122.md' | Select-Object -First 120`
>
> </details>
>
> Bản UID đã được tạo với 1.369 dòng và đủ 14 wireframe. Trong lúc rà soát mình phát hiện một điểm cần siết lại cho đúng lựa chọn “tutorial bắt buộc lần đầu”: host phải bị chặn chuyển từ INTRO sang vòng 1 cho tới khi mọi người chơi mới hoàn tất, không chỉ nhận lời nhắc. Mình đang sửa và kiểm tra các sơ đồ/tham chiếu.
>
> <details><summary>Edited a file, ran 4 commands</summary>
>
> - Wrote `./UID MLN122.md` (+5 -3)
> - Ran ````$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
>   from pathlib import Path
>   import re, collections, json
>   uid=Path('UID MLN122.md').read_text(encoding='utf-8')
>   srs=Path('SRS MLN122.md').read_text(encoding='utf-8')
>   ul=uid.splitlines(); sl=srs.splitlines()
>   errors=[]
>
> def table_defs(text,prefix):
> out=[]
> rx=re.compile(r'^\| `('+re.escape(prefix)+r'[A-Z0-9-]+)` \|')
> for i,l in enumerate(text.splitlines(),1):
> m=rx.match(l)
> if m: out.append((m.group(1),i))
> return out
>
> def heading_defs(text,prefix):
> return [(m.group(1),i) for i,l in enumerate(text.splitlines(),1) if (m:=re.search(r'^#{3,6} `('+re.escape(prefix)+r'[A-Z0-9-]+)`',l))]
>
> # Definition sources by UID prefix.
>
> defs={}
> for p in ['UF-','WF-','DELTA-']:
> defs[p]=heading*defs(uid,p)
> for p in ['IX-','NAV-','COPY-','STATE-','UITC-']:
> defs[p]=table_defs(uid,p)
> for p,rows in defs.items():
> c=collections.Counter(x for x,* in rows)
> dup={k:v for k,v in c.items() if v>1}
> print(p,'defs',len(rows),'unique',len(c),'dups',dup)
> if dup: errors.append(f'duplicate {p} definitions {dup}')
>
> # All exact references should be defined.
>
> refs=set(re.findall(r'`('+re.escape(p)+r'[A-Z0-9-]+)`',uid))
> missing=refs-set(c)
> if missing: errors.append(f'unresolved UID {p}: {sorted(missing)}')
>
> # SRS exact references.
>
> for p in ['UI-','FR-','BR-','LT-','NFR-']:
> known={x for x,\_ in table_defs(srs,p)}
> refs=set(re.findall(r'`('+re.escape(p)+r'[A-Z0-9-]+)`',uid))
> missing=refs-known
> print(p,'refs',len(refs),'missing',sorted(missing))
> if missing: errors.append(f'unresolved SRS {p}: {sorted(missing)}')
>
> # Table structure.
>
> in_table=False; expected=0
> for i,l in enumerate(ul,1):
> if l.startswith('|') and l.endswith('|'):
> pc=l.count('|')
> if not in_table: in_table=True; expected=pc
> elif pc!=expected: errors.append(f'table pipe line {i}: {pc}!={expected}')
> else: in_table=False; expected=0
>
> # Fences and blocks.
>
> fences=sum(1 for l in ul if l.startswith('```'))
> if fences%2: errors.append('unbalanced code fences')
>
> # JSON blocks, if any.
>
> for i,b in enumerate(re.findall(r'`json\n(.*?)\n`',uid,re.S),1):
> try: json.loads(b)
> except Exception as e: errors.append(f'JSON block {i}: {e}')
>
> # Count required wireframes and Mermaid.
>
> wf*ids={x for x,* in defs['WF-']}
> expected_wf={f'WF-{i:02d}' for i in range(1,15)}
> if wf_ids!=expected_wf: errors.append(f'wireframes differ: missing {sorted(expected_wf-wf_ids)} extra {sorted(wf_ids-expected_wf)}')
> mermaid=uid.count('```mermaid')
> if mermaid<9: errors.append(f'only {mermaid} Mermaid blocks')
>
> # Currency and forbidden strings.
>
> for pat in [r'Phi Coin',r'PhiCoin',r'(?:tiền|đơn vị tiền)[^\n|]{0,40}\bPhi\b']:
> hits=[i+1 for i,l in enumerate(ul) if re.search(pat,l,re.I)]
> if hits: errors.append(f'forbidden {pat}: {hits}')
>
> # Ensure all 14 main screens referenced.
>
> main=['UI-AUTH-01','UI-HOME-01','UI-LOBBY-01','UI-HOST-01','UI-MAP-01','UI-PRODUCER-01','UI-CONSUMER-01','UI-INTERMEDIARY-01','UI-STATE-01','UI-TRADE-01','UI-OBSERVATORY-01','UI-RECAP-01','UI-DEBRIEF-01','UI-PROFILE-01']
> for x in main:
> if f'`{x}`' not in uid: errors.append(f'missing main screen {x}')
> print('mermaid',mermaid,'fences',fences,'lines',len(ul),'chars',len(uid))
> print('VALIDATION','PASS' if not errors else 'FAIL')
> for e in errors: print('ERROR',e)
> raise SystemExit(1 if errors else 0)
> '@ | & $py -````
>
> - Ran ``rg -n '`LT-(01|06)`' 'UID MLN122.md'; rg -n 'UITC-TRADE-03' 'UID MLN122.md'; $lines=Get-Content 'UID MLN122.md'; $lines[765..785]``
> - Wrote `./UID MLN122.md` (+3 -3)
> - Ran ````$env:PYTHONIOENCODING='utf-8'; $py='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'; @'
from pathlib import Path
import re, collections
uid=Path('UID MLN122.md').read_text(encoding='utf-8')
srs=Path('SRS MLN122.md').read_text(encoding='utf-8')
ul=uid.splitlines(); sl=srs.splitlines(); errors=[]
def table_defs(text,prefix):
 rx=re.compile(r'^\| `('+re.escape(prefix)+r'[A-Z0-9-]+)`\|')
 return [(m.group(1),i) for i,l in enumerate(text.splitlines(),1) if (m:=rx.match(l))]
def heading_defs(text,prefix):
 return [(m.group(1),i) for i,l in enumerate(text.splitlines(),1) if (m:=re.search(r'^#{3,6}`('+re.escape(prefix)+r'[A-Z0-9-]+)`',l))]
defs={}
for p in ['UF-','WF-','DELTA-']: defs[p]=heading_defs(uid,p)
for p in ['IX-','NAV-','COPY-','STATE-','UITC-']: defs[p]=table_defs(uid,p)
for p,rows in defs.items():
 c=collections.Counter(x for x,_ in rows); dup={k:v for k,v in c.items() if v>1}
 refs=set(re.findall(r'`('+re.escape(p)+r'[A-Z0-9-]+)`',uid)); missing=refs-set(c)
 print(p,'defs',len(rows),'refs',len(refs),'dup',dup,'missing',sorted(missing))
 if dup: errors.append(f'duplicate {p}: {dup}')
 if missing: errors.append(f'unresolved {p}: {sorted(missing)}')
for p in ['UI-','FR-','BR-','LT-','NFR-']:
 known={x for x,_ in table_defs(srs,p)}
 refs=set(re.findall(r'`('+re.escape(p)+r'[A-Z0-9-]+)`',uid)); missing=refs-known
>   print(p,'refs',len(refs),'missing',sorted(missing))
>   if missing: errors.append(f'unresolved SRS {p}: {sorted(missing)}')
>
> # Table structure outside fenced blocks.
>
> in*fence=False; in_table=False; expected=0
> for i,l in enumerate(ul,1):
> if l.startswith('`'):
  in_fence=not in_fence; in_table=False; continue
 if in_fence: continue
 if l.startswith('|') and l.endswith('|'):
  pc=l.count('|')
  if not in_table: in_table=True; expected=pc
  elif pc!=expected: errors.append(f'table pipe line {i}: {pc}!={expected}')
 else: in_table=False; expected=0
fences=sum(1 for l in ul if l.startswith('`'))
> if fences%2: errors.append('unbalanced fences')
> wf={x for x,* in defs['WF-']}; expected_wf={f'WF-{i:02d}' for i in range(1,15)}
> if wf!=expected_wf: errors.append(f'WF mismatch {wf^expected_wf}')
> mermaid=uid.count('```mermaid')
if mermaid!=9: errors.append(f'Mermaid expected 9 got {mermaid}')
for pat in [r'Phi Coin',r'PhiCoin',r'(?:tiền|đơn vị tiền)[^\n|]{0,40}\bPhi\b']:
 hits=[i+1 for i,l in enumerate(ul) if re.search(pat,l,re.I)]
 if hits: errors.append(f'forbidden {pat}: {hits}')
ltrefs=set(re.findall(r'`(LT-[0-9]{2})`',uid))
> if ltrefs!={f'LT-{i:02d}' for i in range(1,15)}: errors.append(f'LT coverage missing {sorted({f"LT-{i:02d}" for i in range(1,15)}-ltrefs)}')
> print('lines',len(ul),'chars',len(uid),'fences',fences,'mermaid',mermaid,'LTcoverage',len(ltrefs))
> print('VALIDATION','PASS' if not errors else 'FAIL')
> for e in errors: print('ERROR',e)
> raise SystemExit(1 if errors else 0)
> '@ | & $py -; $git='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'; & $git diff --check -- 'UID MLN122.md'````
>
> - Ran `Get-Command mmdc -ErrorAction SilentlyContinue | Select-Object Source; $git='C:\Users\hoangnn\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'; & $git status --short; & $git diff --stat -- 'UID MLN122.md'`
>
> </details>
>
> <details><summary>Plan</summary>
>
> UID đã được tạo và kiểm tra: 26 user flows, 27 interactions, 14 wireframes, 9 Mermaid diagrams, 36 microcopy, 12 shared states và 25 interaction test cases; mọi tham chiếu SRS hợp lệ.
>
> - [x] Đối chiếu SRS và lập danh mục flow/screen/interface cho UID
> - [x] Tạo UID MLN122.md với flow, wireframe, microcopy và traceability
> - [x] Kiểm tra ID, tham chiếu SRS, Mermaid/Markdown và thuật ngữ
>
> </details>

</details>

Đã tạo `UID MLN122.md` hoàn chỉnh, gồm:

- 26 user flows end-to-end.
- 14 wireframe ASCII.
- 9 sơ đồ Mermaid.
- 27 interaction–API mappings.
- 36 microcopy quan trọng.
- 12 trạng thái UI.
- 25 interaction test cases.
- Traceability đầy đủ với SRS và toàn bộ `LT-01`–`LT-14`.

Kiểm tra ID, Markdown, code fence và tham chiếu SRS đều pass.

UID cũng ghi rõ `DELTA-SRS-01`: cần bổ sung lưu tiến độ tutorial theo vai vào SRS trước khi triển khai backend.
