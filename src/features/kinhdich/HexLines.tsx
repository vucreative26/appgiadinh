export function HexLines({
  bits,
  moving = [],
  onChange,
}: {
  bits: number;
  moving?: number[];
  onChange?: (i: number) => void;
}) {
  return (
    <div className="hex-lines" aria-label="Sáu hào, hào 6 ở trên và hào 1 ở dưới">
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const text = `Hào ${i + 1}: ${(bits >> i) & 1 ? 'Dương' : 'Âm'}${moving.includes(i + 1) ? ', động' : ''}`;
        const body = (
          <>
            <span className={'hex-line ' + ((bits >> i) & 1 ? 'yang' : 'yin')}>
              <i />
              <i />
            </span>
            <small>
              {i + 1}
              {moving.includes(i + 1) ? ' ◉' : ''}
            </small>
          </>
        );
        return onChange ? (
          <button
            key={i}
            type="button"
            className={moving.includes(i + 1) ? 'moving' : ''}
            aria-label={`${text}, nhấn để đổi`}
            onClick={() => onChange(i)}
          >
            {body}
          </button>
        ) : (
          <div key={i} className={moving.includes(i + 1) ? 'moving' : ''} aria-label={text}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
