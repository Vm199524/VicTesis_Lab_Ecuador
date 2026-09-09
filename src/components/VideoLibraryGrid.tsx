import React, { useMemo, useState } from 'react';
import { PlayCircle, ExternalLink, Clock, Info } from 'lucide-react';
import {
  VIDEO_LIBRARY,
  VIDEO_TRACKS,
  TRACK_THEME,
  buildYoutubeSearchUrl,
  type VideoTrack,
} from '../data/videoLibrary';
import { usePreferences } from '../context/PreferencesContext';

export const VideoLibraryGrid: React.FC = () => {
  const { t, tf } = usePreferences();
  const [activeTrack, setActiveTrack] = useState<VideoTrack | 'Todas'>('Todas');

  const filtered = useMemo(
    () =>
      activeTrack === 'Todas'
        ? VIDEO_LIBRARY
        : VIDEO_LIBRARY.filter((item) => item.track === activeTrack),
    [activeTrack]
  );

  const activeDescription =
    activeTrack === 'Todas'
      ? t('videos.allDescription')
      : (() => {
          const track = VIDEO_TRACKS.find((item) => item.id === activeTrack);
          return track ? tf(`track.${track.id}.description`, track.description) : '';
        })();

  const countByTrack = useMemo(() => {
    const counts = new Map<VideoTrack | 'Todas', number>([['Todas', VIDEO_LIBRARY.length]]);
    VIDEO_LIBRARY.forEach((item) => {
      counts.set(item.track, (counts.get(item.track) ?? 0) + 1);
    });
    return counts;
  }, []);

  return (
    <section id="video-library" className="scroll-mt-32">
      <div className="surface rounded-2xl p-4 sm:p-5">
        {/* Encabezado compacto */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {t('videos.badge')}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1.5">
              {t('videos.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{activeDescription}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            {(['Todas', ...VIDEO_TRACKS.map((t) => t.id)] as (VideoTrack | 'Todas')[]).map(
              (track) => {
                const isActive = activeTrack === track;
                return (
                  <button
                    key={track}
                    onClick={() => setActiveTrack(track)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#002B49] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {/* Punto del color de la ruta: enseña el código cromático de la rejilla */}
                    {track !== 'Todas' && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${TRACK_THEME[track].dot}`}
                      />
                    )}
                    <span>{track === 'Todas' ? t('track.all') : tf(`track.${track}`, track)}</span>
                    <span
                      className={`tabular-nums text-[9px] ${
                        isActive ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {countByTrack.get(track) ?? 0}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Nota de transparencia sobre cómo funcionan los enlaces */}
        <div className="mt-3 flex items-start gap-2 inset-surface rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-snug">{t('videos.transparency')}</p>
        </div>

        {/* Rejilla compacta de recursos, coloreada por ruta */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-3">
          {filtered.map((item) => {
            const theme = TRACK_THEME[item.track];
            return (
              <a
                key={item.id}
                href={buildYoutubeSearchUrl(tf(`video.${item.id}.query`, item.query))}
                target="_blank"
                rel="noreferrer"
                className={`group border border-slate-200 rounded-xl p-3 transition-all flex flex-col ${theme.hover}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.chip}`}
                  >
                    {tf(`track.${item.track}`, item.track)}
                  </span>
                  <PlayCircle
                    className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${theme.icon}`}
                  />
                </div>

                <h4
                  className={`text-[13px] font-extrabold text-slate-900 leading-snug transition-colors ${theme.title}`}
                >
                  {tf(`video.${item.id}.title`, item.title)}
                </h4>

                <p className="text-[11px] text-slate-600 mt-1 leading-snug flex-1">
                  {tf(`video.${item.id}.outcome`, item.outcome)}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 min-w-0">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{tf(`video.${item.id}.moment`, item.moment)}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 shrink-0 ${theme.link}`}
                  >
                    {t('videos.watch')} <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
