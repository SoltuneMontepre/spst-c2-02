# **SOFTWARE REQUIREMENTS SPECIFICATION (SRS)**

## **Tên dự án**

PHIÊN CHỢ GIÁ TRỊ – Mô phỏng quy luật giá trị và cơ chế hình thành giá cả thị trường

## **1\. Giới thiệu**

### **1.1 Mục tiêu**

Thiết kế một hoạt động trải nghiệm giúp người tham gia hiểu:

* Khái niệm hàng hóa.  
* Giá trị sử dụng và giá trị của hàng hóa.  
* Vai trò của lao động xã hội trong việc tạo ra giá trị.  
* Cơ chế trao đổi hàng hóa trên thị trường.  
* Tác động của cung và cầu đến giá cả.

### **1.2 Phạm vi**

Mô hình triển lãm mô phỏng một phiên chợ trong đó người tham gia thực hiện hoạt động mua bán hàng hóa bằng tiền mô phỏng.

Thông qua nhiều vòng giao dịch, người tham gia quan sát được sự thay đổi của giá cả và mối liên hệ giữa giá trị hàng hóa với giá thị trường.

## **2\. Cơ sở lý luận**

### **2.1 Hàng hóa**

Hàng hóa là sản phẩm của lao động có thể thỏa mãn nhu cầu của con người thông qua trao đổi mua bán.

### **2.2 Hai thuộc tính của hàng hóa**

* Giá trị sử dụng: Công dụng của hàng hóa.  
* Giá trị: Lao động xã hội của người sản xuất kết tinh trong hàng hóa.

### **2.3 Quy luật giá trị**

Việc sản xuất và trao đổi hàng hóa được thực hiện dựa trên thời gian lao động xã hội cần thiết.

### **2.4 Quan hệ cung – cầu**

Giá cả thị trường chịu ảnh hưởng của:

* Nhu cầu mua.  
* Lượng hàng hóa cung ứng.  
* Mức độ khan hiếm của hàng hóa.

## **3\. Mô tả trải nghiệm**

### **3.1 Thành phần**

* Khu vực người bán.  
* Khu vực người mua.  
* Hàng hóa mô phỏng.  
* Tiền mô phỏng.  
* Bảng theo dõi giá.  
* Người điều phối.

### **3.2 Vai trò**

#### **Người bán**

* Nhận hàng hóa mô phỏng.  
* Công bố giá bán.  
* Thực hiện giao dịch.

#### **Người mua**

* Nhận ngân sách giới hạn.  
* So sánh giá.  
* Quyết định mua hàng.

#### **Điều phối viên**

* Điều chỉnh các điều kiện thị trường.  
* Công bố các sự kiện ảnh hưởng đến cung và cầu.

## **4\. Kịch bản trải nghiệm**

### **Giai đoạn 1 – Khởi tạo thị trường**

* Phân vai người mua và người bán.  
* Phát hàng hóa và tiền mô phỏng.

### **Giai đoạn 2 – Giao dịch bình thường**

* Người bán đưa ra mức giá ban đầu.  
* Người mua tiến hành mua bán.

### **Giai đoạn 3 – Biến động cung cầu**

Điều phối viên đưa ra các tình huống:

* Khan hiếm hàng hóa.  
* Nhu cầu tăng mạnh.  
* Dư thừa hàng hóa.

### **Giai đoạn 4 – Giao dịch lần hai**

Người tham gia tiếp tục giao dịch trong điều kiện mới.

### **Giai đoạn 5 – Tổng kết**

So sánh:

* Giá trị hàng hóa.  
* Giá giao dịch ban đầu.  
* Giá giao dịch sau biến động.

## **5\. Functional Requirements**

### **FR1**

Hệ thống phải cho phép phân vai người mua và người bán.

### **FR2**

Hệ thống phải cung cấp hàng hóa và tiền mô phỏng.

### **FR3**

Người tham gia phải thực hiện được giao dịch mua bán.

### **FR4**

Điều phối viên phải tạo được các kịch bản thay đổi cung cầu.

### **FR5**

Giá giao dịch phải được ghi nhận sau mỗi vòng.

### **FR6**

Hệ thống phải hiển thị kết quả tổng kết cuối chương trình.

## **6\. Business Rules**

### **BR1**

Mỗi loại hàng hóa được gán một giá trị cơ sở phản ánh lượng lao động xã hội cần thiết để tạo ra hàng hóa đó.

### **BR2**

Giá giao dịch có thể cao hơn hoặc thấp hơn giá trị cơ sở.

### **BR3**

Khi cầu lớn hơn cung, giá thị trường có xu hướng tăng.

### **BR4**

Khi cung lớn hơn cầu, giá thị trường có xu hướng giảm.

### **BR5**

Trong dài hạn, giá cả có xu hướng vận động quanh giá trị hàng hóa.

### **BR6**

Mọi giao dịch phải sử dụng tiền mô phỏng.

## **7\. Kết quả mong đợi**

Sau trải nghiệm, người tham gia có thể:

* Phân biệt giá trị sử dụng và giá trị.  
* Giải thích nguồn gốc giá trị hàng hóa.  
* Hiểu vai trò của lao động trong sản xuất hàng hóa.  
* Phân tích ảnh hưởng của cung cầu tới giá cả.  
* Giải thích vì sao giá thị trường không luôn bằng giá trị hàng hóa.

