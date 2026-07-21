type Props = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

const replies = [
  "Recommend a coffee",
  "Show me the menu",
  "Cold coffee",
  "Desserts",
  "Best seller",
];

export default function QuickReplies({ onSelect, disabled }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: "10px",
      }}
    >
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          style={{
            borderRadius: 20,
            border: "1px solid #ddd",
            background: "#fff",
            padding: "8px 14px",
            cursor: disabled ? "default" : "pointer",
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}