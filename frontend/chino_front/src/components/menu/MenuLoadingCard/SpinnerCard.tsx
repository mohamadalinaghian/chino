"use client";

export default function SpinnerCard() {
  return (
    <div className="relative w-[300px] h-[280px] mx-auto">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[280px]">
        <div className="relative w-full h-20 bg-[#ddcfcc] rounded-[10px]">
          <div className="absolute top-[25px] left-[15px] w-[25px] h-[25px] rounded-full bg-[#282323] after:content-[''] after:w-2 after:h-2 after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:bg-[#615e5e]" />
          <div className="absolute top-[25px] left-[50px] w-[25px] h-[25px] rounded-full bg-[#282323] after:content-[''] after:w-2 after:h-2 after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:bg-[#615e5e]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-[#9acfc5] border-[5px] border-[#43beae]" />
          <div className="absolute top-[10px] right-[10px] w-2 h-5 bg-[#9b9091] shadow-[inset_-12px_0_0_#9b9091,_inset_-24px_0_0_#9b9091]" />
        </div>

        <div className="absolute top-[80px] left-[5%] w-[90%] h-[160px] bg-[#bcb0af] before:content-[''] before:absolute before:bottom-0 before:left-[5%] before:w-[90%] before:h-[100px] before:bg-[#776f6e] before:rounded-t-[20px]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-[20px] bg-[#231f20] before:content-[''] before:absolute before:bottom-[-20px] before:left-1/2 before:-translate-x-1/2 before:w-[50px] before:h-[20px] before:bg-[#231f20] before:rounded-b-full after:content-[''] after:absolute after:bottom-[-30px] after:left-1/2 after:-translate-x-1/2 after:w-[10px] after:h-[10px] after:bg-[#231f20]" />
          <div className="absolute top-[15px] right-[25px] w-[70px] h-[20px] bg-[#231f20] before:content-[''] before:absolute before:top-[7px] before:left-[-15px] before:w-[15px] before:h-[5px] before:bg-[#9e9495]" />
          <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-[6px] h-[63px] bg-[#74372b] opacity-0 animate-[liquid_4s_4s_linear_infinite]" />

          <div className="absolute bottom-[50px] left-[102px] w-2 h-5 rounded bg-[#b3aeae] animate-[smokeOne_3s_4s_linear_infinite] opacity-0" />
          <div className="absolute bottom-[70px] left-[118px] w-2 h-5 rounded bg-[#b3aeae] animate-[smokeTwo_3s_5s_linear_infinite] opacity-0" />
          <div className="absolute bottom-[65px] right-[118px] w-2 h-5 rounded bg-[#b3aeae] animate-[smokeTwo_3s_6s_linear_infinite] opacity-0" />
          <div className="absolute bottom-[50px] right-[102px] w-2 h-5 rounded bg-[#b3aeae] animate-[smokeOne_3s_5s_linear_infinite] opacity-0" />

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-[47px] bg-white rounded-b-[70px_70px_110px_110px] after:content-[''] after:absolute after:top-[6px] after:right-[-13px] after:w-[20px] after:h-[20px] after:rounded-full after:border-[5px] after:border-white" />
        </div>

        <div className="absolute bottom-[25px] left-[2.5%] w-[95%] h-[15px] bg-[#41bdad] rounded-[10px] after:content-[''] after:absolute after:bottom-[-25px] after:left-[-8px] after:w-[106%] after:h-[26px] after:bg-black" />
      </div>

      <style jsx global>{`
        @keyframes liquid {
          0%,
          5% {
            height: 0px;
            opacity: 1;
          }
          20%,
          95% {
            height: 62px;
            opacity: 1;
          }
          100% {
            height: 62px;
            opacity: 0;
          }
        }
        @keyframes smokeOne {
          0% {
            bottom: 20px;
            opacity: 0;
          }
          40% {
            bottom: 50px;
            opacity: 0.5;
          }
          80% {
            bottom: 80px;
            opacity: 0.3;
          }
          100% {
            bottom: 80px;
            opacity: 0;
          }
        }
        @keyframes smokeTwo {
          0% {
            bottom: 40px;
            opacity: 0;
          }
          40% {
            bottom: 70px;
            opacity: 0.5;
          }
          80% {
            bottom: 80px;
            opacity: 0.3;
          }
          100% {
            bottom: 80px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
