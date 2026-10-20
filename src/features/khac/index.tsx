import { PageTitle } from '../../components/Shared';
import { Icon, type IconName } from '../../components/Icon';
export default function More() {
  const items: {
    icon: IconName;
    title: string;
    description: string;
    path: string;
    color: string;
  }[] = [
    {
      icon: 'bag',
      title: 'Đi chợ cùng nhau',
      description: 'Danh sách chung, ai tiện thì mua.',
      path: 'dicho',
      color: 'peach',
    },
    {
      icon: 'split',
      title: 'Share Bill',
      description: 'Chia tiền gọn gàng sau mỗi cuộc vui.',
      path: 'sharebill',
      color: 'mint',
    },
    {
      icon: 'settings',
      title: 'Cài đặt & kết nối',
      description: 'Kết nối gia đình và cài app lên màn hình.',
      path: 'caidat',
      color: 'lavender',
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="NHỮNG VIỆC NHỎ MỖI NGÀY"
        title="Một ngăn tiện ích"
        description="Cần gì cho nhà mình, tìm ở đây nhé."
      />
      <div className="utility-grid">
        {items.map((v) => (
          <a className="card utility-card" href={`#/${v.path}`}>
            <span className={`tile-icon ${v.color}`}>
              <Icon name={v.icon} size={28} />
            </span>
            <h2>{v.title}</h2>
            <p>{v.description}</p>
            <span className="card-bottom">
              Mở tiện ích <Icon name="arrow" size={18} />
            </span>
          </a>
        ))}
      </div>
      <div className="notice row">
        <Icon name="flower" />
        <span>Sổ ngày giỗ nằm trong menu gia đình ở góc trên bên phải.</span>
        <a href="#/giong" className="text-link">
          Mở sổ <Icon name="arrow" size={16} />
        </a>
      </div>
    </>
  );
}
