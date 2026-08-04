// components/contact/WorkingHours.tsx
interface WorkingHoursProps {
  hours: {
    weekdays: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { isClosed: boolean };
  };
}

export default function WorkingHours({ hours }: WorkingHoursProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-black rounded-full"></span>
        ساعات العمل
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">السبت - الأربعاء</span>
          <span className="font-medium text-gray-800">
            {hours.weekdays.start} - {hours.weekdays.end}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">الخميس</span>
          <span className="font-medium text-gray-800">
            {hours.thursday.start} - {hours.thursday.end}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">الجمعة</span>
          <span className="font-medium text-[#23A6F0]">
            {hours.friday.isClosed ? "مغلق" : "متاح"}
          </span>
        </div>
      </div>
    </div>
  );
}