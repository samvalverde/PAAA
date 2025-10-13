# charts_local.py
import pandas as pd

def bar_pct(series: pd.Series, top_n: int = 10, normalize: bool = True,
            title: str | None = None, save_path: str | None = None):
    """
    Devuelve un DataFrame con conteos y % por categoría (top_n).
    Si hay matplotlib instalado, genera una gráfica opcional (save_path).
    """
    s = series.fillna("∅")
    counts = s.value_counts(dropna=False)
    total = counts.sum()
    df = pd.DataFrame({
        "count": counts,
        "pct": (counts / total * 100).round(2)
    }).head(top_n)

    # Plot opcional (no rompe si matplotlib no está instalado)
    if save_path or title:
        try:
            import matplotlib.pyplot as plt
            ax = df["pct"].plot(kind="bar")
            ax.set_ylabel("%")
            if title:
                ax.set_title(title)
            for i, v in enumerate(df["pct"]):
                ax.text(i, float(v), f"{v:.1f}%", ha="center", va="bottom", fontsize=8)
            fig = ax.get_figure()
            if save_path:
                fig.savefig(save_path, bbox_inches="tight")
            plt.close(fig)
        except Exception:
            pass

    return df
