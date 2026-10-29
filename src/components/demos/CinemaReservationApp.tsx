import React, { useMemo, useState } from 'react';
import {
  Film,
  Ticket,
  Volume2,
  Eye,
  CheckCircle2,
  Sparkles,
  QrCode,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

interface MovieScreening {
  id: string;
  title: string;
  director: string;
  format: string;
  aspectRatio: string;
  duration: string;
  rating: string;
  hallName: string;
  glowFrom: string;
  glowTo: string;
  accentHex: string;
  showtimes: string[];
}

const SCREENINGS: MovieScreening[] = [
  {
    id: 'dune',
    title: 'DUNE: MESSIAH',
    director: 'Denis Villeneuve',
    format: 'IMAX 70mm Dual Laser · 12-Ch Sound',
    aspectRatio: '1.43:1 Full Dome',
    duration: '2h 54m',
    rating: 'PG-13',
    hallName: 'Auditorium 01 · Grand Laser',
    glowFrom: 'rgba(245, 158, 11, 0.42)',
    glowTo: 'rgba(217, 119, 6, 0.04)',
    accentHex: '#F59E0B',
    showtimes: ['18:30', '21:45', '00:15'],
  },
  {
    id: 'interstellar',
    title: 'INTERSTELLAR: ODYSSEY',
    director: 'Christopher Nolan',
    format: 'IMAX 70mm Film Projection',
    aspectRatio: '1.43:1 Native',
    duration: '2h 49m',
    rating: 'PG-13',
    hallName: 'Auditorium 01 · Grand Laser',
    glowFrom: 'rgba(56, 189, 248, 0.42)',
    glowTo: 'rgba(37, 99, 235, 0.04)',
    accentHex: '#38BDF8',
    showtimes: ['17:00', '20:30', '23:30'],
  },
  {
    id: 'bladerunner',
    title: 'BLADE RUNNER: NEXUS',
    director: 'Ridley Scott / Denis Villeneuve',
    format: 'Dolby Vision 3D · Atmos 128-Obj',
    aspectRatio: '2.39:1 Scope',
    duration: '2h 44m',
    rating: 'R',
    hallName: 'Auditorium 02 · Onyx Black',
    glowFrom: 'rgba(236, 72, 153, 0.38)',
    glowTo: 'rgba(139, 92, 246, 0.04)',
    accentHex: '#EC4899',
    showtimes: ['19:15', '22:00'],
  },
];

type SeatTier = 'standard' | 'prime' | 'vip';

interface SeatInfo {
  id: string;
  row: string;
  col: number;
  tier: SeatTier;
  price: number;
  occupied: boolean;
}

const ROWS: { row: string; tier: SeatTier; price: number }[] = [
  { row: 'A', tier: 'standard', price: 16 },
  { row: 'B', tier: 'standard', price: 16 },
  { row: 'C', tier: 'prime', price: 24 },
  { row: 'D', tier: 'prime', price: 24 },
  { row: 'E', tier: 'vip', price: 34 },
  { row: 'F', tier: 'vip', price: 34 },
];

const PRE_OCCUPIED = new Set([
  'A-4',
  'A-5',
  'B-3',
  'B-6',
  'C-2',
  'C-7',
  'D-4',
  'D-5',
  'E-3',
  'E-8',
  'F-5',
  'F-6',
]);

const CONCESSIONS = [
  { id: 'c1', name: 'Black Truffle & Parmesan Popcorn', price: 12 },
  { id: 'c2', name: 'Ceremonial Matcha Sparkling Elixir', price: 9 },
  { id: 'c3', name: 'Artisanal Smoked Brisket Sliders', price: 18 },
];

export const CinemaReservationApp: React.FC<{
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}> = ({ isExpanded = false, onToggleExpand }) => {
  const [movie, setMovie] = useState<MovieScreening>(SCREENINGS[0]);
  const [showtime, setShowtime] = useState<string>(SCREENINGS[0].showtimes[1]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['C-4', 'C-5']);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set(PRE_OCCUPIED));
  const [showAcousticZone, setShowAcousticZone] = useState<boolean>(true);
  const [selectedSnacks, setSelectedSnacks] = useState<string[]>(['c1']);
  const [guestName, setGuestName] = useState<string>('Sashwat Dhakal');
  const [issuedTicket, setIssuedTicket] = useState<{
    code: string;
    movieTitle: string;
    hall: string;
    time: string;
    seats: string[];
    total: number;
    guest: string;
  } | null>(null);

  const allSeats: SeatInfo[] = useMemo(() => {
    const list: SeatInfo[] = [];
    for (const r of ROWS) {
      for (let col = 1; col <= 8; col++) {
        const id = `${r.row}-${col}`;
        list.push({
          id,
          row: r.row,
          col,
          tier: r.tier,
          price: r.price,
          occupied: bookedSeats.has(id),
        });
      }
    }
    return list;
  }, [bookedSeats]);

  const toggleSeat = (id: string) => {
    if (bookedSeats.has(id)) return;
    setIssuedTicket(null);
    setSelectedSeats((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const toggleSnack = (id: string) => {
    setIssuedTicket(null);
    setSelectedSnacks((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const seatSubtotal = useMemo(() => {
    return selectedSeats.reduce((sum, id) => {
      const found = allSeats.find((s) => s.id === id);
      return sum + (found ? found.price : 0);
    }, 0);
  }, [selectedSeats, allSeats]);

  const snackSubtotal = useMemo(() => {
    return selectedSnacks.reduce((sum, id) => {
      const found = CONCESSIONS.find((c) => c.id === id);
      return sum + (found ? found.price : 0);
    }, 0);
  }, [selectedSnacks]);

  const totalAmount = seatSubtotal + snackSubtotal;

  // Compute dynamic sightline & acoustic telemetry based on selected seats
  const telemetry = useMemo(() => {
    if (selectedSeats.length === 0) {
      return { angle: '34° Center', acoustic: '98.8% Atmos Lock', distance: '14.5m' };
    }
    const primary = selectedSeats[0];
    const rowChar = primary.split('-')[0];
    if (rowChar === 'C' || rowChar === 'D') {
      return {
        angle: '36° Reference Eye-Line',
        acoustic: '99.7% Dolby Sweet-Spot',
        distance: '13.8m Optimal',
      };
    }
    if (rowChar === 'E' || rowChar === 'F') {
      return {
        angle: '28° Elevated Panoramic',
        acoustic: '97.4% Surround Envelope',
        distance: '18.4m VIP',
      };
    }
    return {
      angle: '46° Immersive Front',
      acoustic: '95.2% Front Array',
      distance: '8.6m Close',
    };
  }, [selectedSeats]);

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) return;
    const code = `CV-${Math.floor(100000 + Math.random() * 900000)}`;
    const nextBooked = new Set(bookedSeats);
    selectedSeats.forEach((s) => nextBooked.add(s));
    setBookedSeats(nextBooked);
    setIssuedTicket({
      code,
      movieTitle: movie.title,
      hall: movie.hallName,
      time: `Today · ${showtime}`,
      seats: [...selectedSeats],
      total: totalAmount,
      guest: guestName || 'VIP Guest',
    });
  };

  return (
    <div className="w-full rounded-2xl bg-[#08080C] border border-white/10 text-zinc-100 overflow-hidden shadow-2xl">
      {/* Top Cinema Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#0F1017] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif italic text-xl text-white">CineVault IMAX</span>
          <span className="text-zinc-600">·</span>
          <span className="font-mono text-[11px] text-amber-400 uppercase tracking-wider">
            Spatial Auditorium & VIP Seat Reservation
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#07080C] p-1 rounded-xl border border-white/[0.06]">
          {SCREENINGS.map((scr) => (
            <button
              key={scr.id}
              type="button"
              onClick={() => {
                setMovie(scr);
                setShowtime(scr.showtimes[0]);
                setIssuedTicket(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium transition-all whitespace-nowrap shrink-0 ${
                movie.id === scr.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {scr.title.split(':')[0]}
            </button>
          ))}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="ml-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-amber-400 hover:bg-white/5 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>{isExpanded ? 'Compact' : 'Fullscreen Hall'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left / Center Auditorium Spatial Seating Map (8 cols) */}
        <div className="lg:col-span-8 p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col justify-between relative overflow-hidden bg-[#07070B]">
          {/* Screening Metadata & Showtimes */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>{movie.hallName}</span>
                <span>·</span>
                <span>{movie.format}</span>
              </div>
              <h4 className="font-serif text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
                {movie.title}
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              {movie.showtimes.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setShowtime(st);
                    setIssuedTicket(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all border ${
                    showtime === st
                      ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                      : 'bg-[#12141E] text-zinc-300 border-white/[0.07] hover:border-white/20'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Curved IMAX Laser Screen with Ambient Glow */}
          <div className="relative w-full max-w-xl mx-auto mb-8 pt-2">
            <div
              className="w-full h-14 rounded-t-[100%] opacity-80 blur-2xl pointer-events-none transition-all duration-700"
              style={{
                background: `radial-gradient(ellipse at top, ${movie.glowFrom}, ${movie.glowTo}, transparent 75%)`,
              }}
            />
            <svg
              viewBox="0 0 600 58"
              className="w-full h-12 -mt-10 overflow-visible drop-shadow-[0_12px_28px_rgba(245,158,11,0.3)]"
            >
              <defs>
                <linearGradient id="imaxScreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                  <stop offset="50%" stopColor={movie.accentHex} stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <path
                d="M 20 46 Q 300 4 580 46"
                fill="none"
                stroke="url(#imaxScreenGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 35 52 Q 300 14 565 52"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
              />
            </svg>
            <div className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500 -mt-2">
              Curved IMAX Laser Projection Screen ({movie.aspectRatio})
            </div>
          </div>

          {/* Auditorium Seating Matrix */}
          <div className="relative max-w-xl mx-auto w-full space-y-2.5 my-2 z-10">
            {/* Optional Dolby Atmos Sweet Spot Acoustic Overlay */}
            {showAcousticZone && (
              <div
                className="pointer-events-none absolute inset-x-10 top-[31%] h-[34%] rounded-3xl border border-dashed border-cyan-400/35 bg-cyan-400/[0.04] flex items-center justify-end pr-3"
                title="Dolby Atmos Reference Sweet-Spot"
              >
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80">
                  Atmos Sweet-Spot
                </span>
              </div>
            )}

            {ROWS.map((r) => {
              const rowSeats = allSeats.filter((s) => s.row === r.row);
              return (
                <div key={r.row} className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="w-5 font-mono text-xs text-zinc-500 text-right">{r.row}</span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.map((seat, idx) => {
                      const isSelected = selectedSeats.includes(seat.id);
                      const isAisleAfter = idx === 1 || idx === 5;

                      let seatStyle =
                        'bg-[#161925] border-white/10 text-zinc-400 hover:border-white/30';
                      if (seat.tier === 'prime') {
                        seatStyle =
                          'bg-[#191E30] border-cyan-500/30 text-cyan-200 hover:border-cyan-400';
                      } else if (seat.tier === 'vip') {
                        seatStyle =
                          'bg-[#241B15] border-amber-500/35 text-amber-200 hover:border-amber-400';
                      }

                      if (seat.occupied) {
                        seatStyle =
                          'bg-zinc-900/60 border-white/[0.04] text-zinc-700 cursor-not-allowed';
                      } else if (isSelected) {
                        seatStyle =
                          'bg-amber-400 border-amber-300 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105';
                      }

                      return (
                        <React.Fragment key={seat.id}>
                          <button
                            type="button"
                            disabled={seat.occupied}
                            onClick={() => toggleSeat(seat.id)}
                            title={`Seat ${seat.id} · ${seat.tier.toUpperCase()} ($${seat.price})`}
                            className={`h-8 sm:h-9 ${
                              seat.tier === 'vip' ? 'w-9 sm:w-11 rounded-xl' : 'w-7 sm:w-8 rounded-t-lg rounded-b-md'
                            } border text-[10px] font-mono transition-all flex items-center justify-center ${seatStyle}`}
                          >
                            {seat.occupied ? '×' : `${seat.row}${seat.col}`}
                          </button>
                          {isAisleAfter && <div className="w-2 sm:w-4" />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <span className="w-5 font-mono text-xs text-zinc-500">{r.row}</span>
                </div>
              );
            })}
          </div>

          {/* Seat Legend & Acoustic Telemetry Bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#161925] border border-white/15" />
                <span>Standard ($16)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#191E30] border border-cyan-500/40" />
                <span>Atmos Prime ($24)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3 rounded-sm bg-[#241B15] border border-amber-500/45" />
                <span>VIP Lounger ($34)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-400" />
                <span className="text-white">Selected</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAcousticZone((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1.5 transition-colors ${
                  showAcousticZone
                    ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Atmos Zone</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookedSeats(new Set(PRE_OCCUPIED));
                  setSelectedSeats(['C-4', 'C-5']);
                  setIssuedTicket(null);
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Hall
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Sightline Telemetry, Concessions & Boarding Pass Checkout (4 cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0B0C12] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Live Seat Telemetry Box */}
            <div className="p-3.5 rounded-2xl bg-[#12141F] border border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="inline-flex items-center gap-1.5 text-amber-400 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5" />
                  Sightline & Acoustic Telemetry
                </span>
                <span>{ telemetry.distance }</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-black/30">
                  <div className="text-[10px] font-mono text-zinc-500">Viewing Angle</div>
                  <div className="text-xs font-mono text-white mt-0.5">{telemetry.angle}</div>
                </div>
                <div className="p-2 rounded-xl bg-black/30">
                  <div className="text-[10px] font-mono text-zinc-500">Sound Field</div>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">
                    {telemetry.acoustic}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Seats & Guest Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Selected Seats ({selectedSeats.length})
                </label>
                <div className="px-3 py-2 rounded-xl bg-[#131622] border border-white/[0.07] font-mono text-xs text-amber-400 truncate">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Pass Holder
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131622] border border-white/[0.07] font-sans text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* VIP In-Seat Concessions */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                In-Seat Concierge Pairing (Optional)
              </label>
              <div className="space-y-1.5">
                {CONCESSIONS.map((item) => {
                  const active = selectedSnacks.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSnack(item.id)}
                      className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        active
                          ? 'bg-amber-400/10 border-amber-400/40 text-white'
                          : 'bg-[#12141E] border-white/[0.05] text-zinc-400 hover:border-white/15'
                      }`}
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-mono text-amber-400 shrink-0">+${item.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issued Holographic IMAX Boarding Pass */}
            {issuedTicket && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-[#161824] to-cyan-500/15 border border-amber-400/40 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    IMAX LASER PASS ISSUED
                  </span>
                  <span className="text-zinc-300">#{issuedTicket.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif text-lg text-white leading-tight">
                      {issuedTicket.movieTitle}
                    </div>
                    <div className="font-mono text-[11px] text-zinc-300">
                      {issuedTicket.time} · Seats: {issuedTicket.seats.join(', ')}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                      Guest: {issuedTicket.guest} · Paid ${issuedTicket.total}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white text-black shrink-0">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Breakdown & Checkout Button */}
          <div className="pt-3 border-t border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                Total ({selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} +
                Concierge)
              </span>
              <span className="text-lg font-semibold text-white tabular-nums">
                ${totalAmount}.00
              </span>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={handleConfirmBooking}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-sans font-semibold text-xs uppercase tracking-widest transition-all shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Reserve Seats & Issue IMAX Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
