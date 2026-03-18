"""
LangGraph workflow visualization helper.

Usage:
  python -m app.graph.visualize_workflow
"""

from app.graph.workflow import build_graph


def main() -> None:
    builder = build_graph()

    try:
        graph = builder.compile()
    except Exception:
        graph = builder

    # Save the graph visualization to a PNG file
    try:
        png_data = graph.get_graph().draw_mermaid_png()
        with open("workflow_graph.png", "wb") as f:
            f.write(png_data)
        print("Graph visualization saved to workflow_graph.png")
    except Exception as e:
        print(f"Failed to generate graph image: {e}")
        # Fallback to printing mermaid syntax
        print("Mermaid syntax:")
        print(graph.get_graph().draw_mermaid())


if __name__ == "__main__":
    main()
